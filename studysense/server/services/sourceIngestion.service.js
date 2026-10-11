const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const AdmZip = require('adm-zip');

/**
 * Normalizes text whitespace without altering semantic meaning.
 * @param {string} text
 * @returns {string}
 */
const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
};

/**
 * Extracts plain text from an uploaded PDF buffer.
 * Detects encrypted, corrupted, or scanned/image-only PDFs.
 * @param {Buffer} buffer
 * @returns {Promise<{ text: string, pages: number, info: object }>}
 */
const extractTextFromPdf = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF file is empty (0 bytes).');
  }

  // Check magic number for PDF (%PDF)
  if (buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
    throw new Error('Invalid PDF format: file does not contain a valid PDF signature.');
  }

  try {
    const data = await pdfParse(buffer, {
      max: 100 // Reasonable safe upper bound for MCA project study materials
    });

    const cleanedText = normalizeText(data.text);

    if (!cleanedText || cleanedText.length < 20) {
      throw new Error(
        'PDF document contains no readable text. It may consist of scanned images or require OCR, which is not supported.'
      );
    }

    return {
      text: cleanedText,
      pages: data.numpages || 1,
      info: {
        pageCount: data.numpages,
        version: data.version
      }
    };
  } catch (err) {
    if (err.message && (err.message.includes('password') || err.message.includes('encrypted'))) {
      throw new Error('PDF document is encrypted or password-protected and cannot be parsed.');
    }
    throw err;
  }
};

/**
 * Extracts text from PowerPoint presentations (.pptx).
 * Extracts slide text and speaker notes from open XML slide structures safely.
 * @param {Buffer} buffer
 * @returns {Promise<{ text: string, slidesCount: number }>}
 */
const extractTextFromPptx = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Presentation file is empty (0 bytes).');
  }

  // Check zip magic number (PK..)
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error('Invalid PowerPoint file: format is not a valid modern OpenXML (.pptx) presentation.');
  }

  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    let slideTexts = [];
    let slideCount = 0;

    // Filter slide XML entries (ppt/slides/slide1.xml, etc.)
    const slideEntries = zipEntries.filter(
      (entry) =>
        entry.entryName.startsWith('ppt/slides/slide') &&
        entry.entryName.endsWith('.xml')
    );

    // Sort slides numerically by slide index
    slideEntries.sort((a, b) => {
      const numA = parseInt(a.entryName.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.entryName.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    for (const entry of slideEntries) {
      slideCount++;
      const xmlContent = entry.getData().toString('utf8');
      // Extract <a:t>...</a:t> text nodes inside slide XML
      const textMatches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/gs) || [];
      const extractedNodes = textMatches
        .map((m) => m.replace(/<[^>]+>/g, '').trim())
        .filter((t) => t.length > 0);

      if (extractedNodes.length > 0) {
        slideTexts.push(`--- Slide ${slideCount} ---\n` + extractedNodes.join(' '));
      }
    }

    // Also check notes slides if present (ppt/notesSlides/notesSlide1.xml)
    const notesEntries = zipEntries.filter(
      (entry) =>
        entry.entryName.startsWith('ppt/notesSlides/notesSlide') &&
        entry.entryName.endsWith('.xml')
    );

    for (const entry of notesEntries) {
      const xmlContent = entry.getData().toString('utf8');
      const textMatches = xmlContent.match(/<a:t[^>]*>(.*?)<\/a:t>/gs) || [];
      const extractedNotes = textMatches
        .map((m) => m.replace(/<[^>]+>/g, '').trim())
        .filter((t) => t.length > 0);

      if (extractedNotes.length > 0) {
        slideTexts.push(`[Speaker Notes]: ` + extractedNotes.join(' '));
      }
    }

    const fullText = normalizeText(slideTexts.join('\n\n'));

    if (!fullText || fullText.length < 15) {
      throw new Error(
        'Presentation slides contain no extractable text. Slides may be image-only diagrams.'
      );
    }

    return {
      text: fullText,
      slidesCount: slideCount
    };
  } catch (err) {
    if (err.message && err.message.includes('Presentation slides contain no extractable text')) {
      throw err;
    }
    throw new Error(`Failed to parse presentation: ${err.message}`);
  }
};

/**
 * Validates URLs against SSRF (Server-Side Request Forgery).
 * Rejects localhost, 127.0.0.1, private RFC1918 ranges, cloud metadata (169.254.169.254),
 * non-http/https protocols.
 * @param {string} rawUrl
 * @returns {URL} validated URL object
 */
const validatePublicUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('A valid URL is required.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    throw new Error('Malformed URL provided.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are permitted.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and standard loopbacks
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0'
  ) {
    throw new Error('Access to localhost and internal loopback addresses is prohibited.');
  }

  // Block AWS / GCP / Azure metadata IP
  if (hostname === '169.254.169.254') {
    throw new Error('Access to cloud metadata endpoints is prohibited.');
  }

  // Check IPv4 private network ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (match) {
    const octet1 = parseInt(match[1], 10);
    const octet2 = parseInt(match[2], 10);

    if (
      octet1 === 10 || // 10.0.0.0/8
      octet1 === 127 || // 127.0.0.0/8
      (octet1 === 172 && octet2 >= 16 && octet2 <= 31) || // 172.16.0.0/12
      (octet1 === 192 && octet2 === 168) || // 192.168.0.0/16
      (octet1 === 169 && octet2 === 254) // link-local
    ) {
      throw new Error('Access to private internal IP addresses is prohibited.');
    }
  }

  return parsed;
};

/**
 * Extracts YouTube Video ID if the given URL is a YouTube link.
 * @param {string} urlString
 * @returns {string|null}
 */
const getYouTubeVideoId = (urlString) => {
  try {
    const parsed = new URL(urlString);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Attempts to retrieve public video caption text from YouTube or safely instructs user.
 * @param {string} videoId
 * @returns {Promise<string>}
 */
const extractYouTubeTranscript = async (videoId) => {
  if (!videoId) {
    throw new Error('Invalid YouTube video URL.');
  }

  try {
    // Attempt fetching video watch page to locate timedtext track
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) {
      throw new Error(`YouTube video page returned HTTP status ${res.status}.`);
    }

    const html = await res.text();

    // Check if captions are present in player response
    const captionTracksMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (captionTracksMatch && captionTracksMatch[1]) {
      const tracks = JSON.parse(captionTracksMatch[1]);
      if (tracks.length > 0 && tracks[0].baseUrl) {
        const transcriptRes = await fetch(tracks[0].baseUrl, {
          signal: AbortSignal.timeout(5000)
        });
        const xml = await transcriptRes.text();
        const textParts = xml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];
        const cleanWords = textParts
          .map((p) => p.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim())
          .filter(Boolean);

        if (cleanWords.length > 0) {
          return normalizeText(cleanWords.join(' '));
        }
      }
    }

    throw new Error(
      'Automated captions or transcripts are disabled, private, or unavailable for this video. Please copy the video transcript or key study notes and paste them directly.'
    );
  } catch (err) {
    if (err.message && err.message.includes('Automated captions')) {
      throw err;
    }
    throw new Error(
      'Unable to extract YouTube video transcript automatically. Please copy the lecture transcript or notes and paste them as text.'
    );
  }
};

/**
 * Ingests external public webpage article text safely.
 * Strips script tags, styles, navigation, and excessive markup.
 * Enforces response timeouts and maximum text payload limits (500 KB).
 * @param {string} urlString
 * @returns {Promise<{ title: string, text: string }>}
 */
const extractWebpageContent = async (urlString) => {
  const validatedUrl = validatePublicUrl(urlString);

  // Check if it's a ChatGPT share URL
  const isChatGPTShare = validatedUrl.hostname.includes('chatgpt.com') && validatedUrl.pathname.includes('/share/');

  let res;
  try {
    res = await fetch(validatedUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,text/plain'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000) // 8s timeout
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('Webpage request timed out after 8 seconds.');
    }
    throw new Error(`Failed to connect to webpage: ${err.message}`);
  }

  if (!res.ok) {
    throw new Error(`Webpage request failed with HTTP status ${res.status}.`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
    throw new Error('Target URL did not return HTML or plain text content.');
  }

  const html = await res.text();

  // Extract page title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  let pageTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : validatedUrl.hostname;

  if (isChatGPTShare) {
    // Attempt extracting conversation messages from ChatGPT public share DOM
    const messageMatches = html.match(/data-message-author-role="[^"]*"[^>]*>(.*?)<\/div>/gs) || [];
    if (messageMatches.length > 0) {
      const messages = messageMatches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      return {
        title: pageTitle || 'ChatGPT Shared Conversation',
        text: normalizeText(messages.join('\n\n'))
      };
    } else {
      // If client-side rendered / dynamic JS blocks extraction
      throw new Error(
        'This ChatGPT share link is dynamically rendered or protected by Cloudflare. Please copy the conversation text and paste it directly into Pasted Text.'
      );
    }
  }

  // Strip scripts, styles, headers, footers, noscript, svg, nav
  let cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  // Extract paragraphs, headers, list items
  const blockMatches = cleanHtml.match(/<(p|h1|h2|h3|h4|li|article|section)[^>]*>(.*?)<\/\1>/gi) || [];
  let extractedParagraphs = [];

  for (const block of blockMatches) {
    const stripped = block.replace(/<[^>]+>/g, ' ').trim();
    if (stripped.length > 20) {
      extractedParagraphs.push(stripped);
    }
  }

  let finalBody = extractedParagraphs.join('\n\n');

  // Fallback to general tag stripping if paragraphs were sparse
  if (finalBody.length < 100) {
    finalBody = cleanHtml.replace(/<[^>]+>/g, ' ');
  }

  const normalized = normalizeText(finalBody);

  if (!normalized || normalized.length < 40) {
    throw new Error('Webpage does not contain sufficient readable article content.');
  }

  // Limit to safe upper bound of 50,000 chars for quiz generation prompt
  const safeText = normalized.slice(0, 50000);

  return {
    title: pageTitle,
    text: safeText
  };
};

module.exports = {
  normalizeText,
  extractTextFromPdf,
  extractTextFromPptx,
  validatePublicUrl,
  getYouTubeVideoId,
  extractYouTubeTranscript,
  extractWebpageContent
};
