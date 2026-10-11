const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');

/**
 * Service handling Topic business logic and database operations
 */
class TopicService {
  /**
   * Verify that the parent subject exists and is owned by the authenticated user
   */
  async verifySubjectOwnership(userId, subjectId) {
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      const error = new Error('Parent subject not found or access denied');
      error.statusCode = 404;
      throw error;
    }
    return subject;
  }

  /**
   * Create a topic inside an owned subject
   */
  async createTopic(userId, subjectId, data) {
    await this.verifySubjectOwnership(userId, subjectId);

    const {
      title,
      description = '',
      status = 'Not Started',
      priority = 'Medium',
      unit = '',
      subtopics = [],
      order = 0,
    } = data;

    const topic = await Topic.create({
      user: userId,
      subject: subjectId,
      title: title.trim(),
      description: description ? description.trim() : '',
      status: status || 'Not Started',
      priority: priority || 'Medium',
      unit: unit ? unit.trim() : '',
      subtopics: Array.isArray(subtopics) ? subtopics : [],
      order: Number(order) || 0,
    });

    return topic.toSafeObject();
  }

  /**
   * List all topics for an owned subject
   */
  async getTopicsBySubject(userId, subjectId) {
    await this.verifySubjectOwnership(userId, subjectId);

    const topics = await Topic.find({ user: userId, subject: subjectId }).sort({ order: 1, createdAt: 1 });
    return topics.map((t) => t.toSafeObject());
  }

  /**
   * Retrieve a single owned topic by ID
   */
  async getTopicById(userId, topicId) {
    const topic = await Topic.findOne({ _id: topicId, user: userId });
    if (!topic) {
      const error = new Error('Topic not found');
      error.statusCode = 404;
      throw error;
    }
    return topic.toSafeObject();
  }

  /**
   * Update topic details or status
   */
  async updateTopic(userId, topicId, updateData) {
    const topic = await Topic.findOne({ _id: topicId, user: userId });
    if (!topic) {
      const error = new Error('Topic not found');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.title !== undefined) {
      topic.title = updateData.title.trim();
    }
    if (updateData.description !== undefined) {
      topic.description = updateData.description.trim();
    }
    if (updateData.status !== undefined) {
      topic.status = updateData.status;
    }
    if (updateData.priority !== undefined) {
      topic.priority = updateData.priority;
    }
    if (updateData.unit !== undefined) {
      topic.unit = updateData.unit ? updateData.unit.trim() : '';
    }
    if (updateData.subtopics !== undefined && Array.isArray(updateData.subtopics)) {
      topic.subtopics = updateData.subtopics;
    }
    if (updateData.order !== undefined) {
      topic.order = Number(updateData.order) || 0;
    }

    await topic.save();
    return topic.toSafeObject();
  }

  /**
   * Delete an owned topic
   */
  async deleteTopic(userId, topicId) {
    const topic = await Topic.findOne({ _id: topicId, user: userId });
    if (!topic) {
      const error = new Error('Topic not found');
      error.statusCode = 404;
      throw error;
    }

    // Unlink topic from any study materials referencing it
    const { StudyMaterial } = require('../models/StudyMaterial');
    await StudyMaterial.updateMany({ topic: topicId, user: userId }, { $set: { topic: null } });

    // Unlink topic from questions and pull from quizzes
    const { Question } = require('../models/Question');
    const { Quiz } = require('../models/Quiz');
    await Question.updateMany({ topic: topicId, user: userId }, { $set: { topic: null } });
    await Quiz.updateMany({ topics: topicId, user: userId }, { $pull: { topics: topicId } });

    await Topic.deleteOne({ _id: topicId, user: userId });
    return {
      id: topicId,
      subject: topic.subject.toString(),
      title: topic.title,
    };
  }

  /**
   * Parse raw syllabus text using intelligent heuristic rules
   */
  parseSyllabusRules(text) {

    if (!text || typeof text !== 'string') return [];

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const extracted = [];
    const seen = new Set();
    let currentUnit = '';

    const addTopic = (rawTitle, unit = '', desc = '', subtopics = []) => {
      let title = rawTitle
        .replace(/^[\s*•\-–—#]+/, '')
        .replace(/^(Unit\s*[0-9IVXivx]+[:\-.]?|Module\s*[0-9IVXivx]+[:\-.]?|Chapter\s*[0-9IVXivx]+[:\-.]?|[0-9]+[.)\-]|\([0-9]+\))\s*/i, '')
        .trim();

      if (title.length < 2 || title.length > 120) return;
      if (/^(syllabus|textbook|textbooks|reference|references|course objectives|course outcomes|evaluation|credits|hours)$/i.test(title)) {
        return;
      }

      const lower = title.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        // Auto-detect priority hint
        let priority = 'Medium';
        if (/critical|core|advanced|architecture|deadlock|concurrency|paging|algorithm/i.test(lower)) {
          priority = 'High';
        } else if (/overview|introduction|history|basics|summary/i.test(lower)) {
          priority = 'Low';
        }

        extracted.push({
          title,
          unit: unit || currentUnit || '',
          description: desc ? desc.slice(0, 300) : '',
          subtopics: Array.isArray(subtopics) ? subtopics : [],
          priority,
          status: 'Not Started',
          order: extracted.length + 1,
        });
      }
    };

    for (const line of lines) {
      // Check if line represents a unit header
      const unitMatch = line.match(/^(?:Unit|Module|Chapter)\s*([0-9IVXivx]+)?\s*[:\-.]?\s*(.+)?$/i);
      if (unitMatch && !line.includes(',') && !line.includes(';')) {
        currentUnit = line.trim();
        if (unitMatch[2] && unitMatch[2].trim().length >= 2) {
          addTopic(unitMatch[2].trim(), currentUnit);
        }
        continue;
      }

      if (line.includes(',') || line.includes(';')) {
        const parts = line.split(/[,;]/);
        for (const part of parts) {
          addTopic(part, currentUnit);
        }
      } else {
        addTopic(line, currentUnit);
      }
    }

    return extracted;
  }

  /**
   * Built-in academic curriculum templates for standard subjects
   */
  getStandardSubjectTopics(subjectName) {
    const sName = (subjectName || '').toLowerCase().trim();

    if (/operat.*system|os/i.test(sName)) {
      return [
        { title: 'Introduction to Operating Systems & Dual-Mode Operations', unit: 'Unit 1: Foundations & Architecture', description: 'OS roles, kernel vs user mode, system calls, interrupt handling', subtopics: ['Kernel Architecture', 'System Calls', 'Interrupts'], priority: 'High' },
        { title: 'Operating System Structure & Monolithic vs Microkernel', unit: 'Unit 1: Foundations & Architecture', description: 'Architectural designs, layered systems, microkernel advantages', subtopics: ['Monolithic Kernels', 'Microkernels', 'Layered Architecture'], priority: 'Medium' },
        { title: 'Process Concepts, States & Process Control Block (PCB)', unit: 'Unit 2: Process Management', description: 'Process life cycle, PCB fields, context switching mechanisms', subtopics: ['Process States', 'PCB Structure', 'Context Switching'], priority: 'High' },
        { title: 'CPU Scheduling Algorithms & Metrics', unit: 'Unit 2: Process Management', description: 'FCFS, SJF, Priority, Round Robin, Multilevel Feedback Queues', subtopics: ['FCFS & SJF', 'Round Robin', 'Turnaround & Waiting Time'], priority: 'High' },
        { title: 'Inter-Process Communication (IPC) & Shared Memory', unit: 'Unit 2: Process Management', description: 'Pipes, message queues, sockets, shared memory synchronization', subtopics: ['Message Passing', 'Shared Memory', 'Pipes & Sockets'], priority: 'Medium' },
        { title: 'Threads & Multithreading Models', unit: 'Unit 2: Process Management', description: 'User vs kernel threads, Many-to-One, One-to-One, Many-to-Many models', subtopics: ['Thread Models', 'Concurrency', 'Thread Pools'], priority: 'Medium' },
        { title: 'Process Synchronization & Critical Section Problem', unit: 'Unit 3: Synchronization & Deadlocks', description: 'Race conditions, Peterson’s solution, hardware synchronization', subtopics: ['Race Conditions', 'Peterson Algorithm', 'Atomic Test-and-Set'], priority: 'High' },
        { title: 'Semaphores & Mutex Locks', unit: 'Unit 3: Synchronization & Deadlocks', description: 'Counting vs binary semaphores, wait/signal operations, condition variables', subtopics: ['Binary Semaphores', 'Counting Semaphores', 'Classic Problems'], priority: 'High' },
        { title: 'Classic Synchronization Problems', unit: 'Unit 3: Synchronization & Deadlocks', description: 'Producer-Consumer, Dining Philosophers, Readers-Writers problems', subtopics: ['Producer-Consumer', 'Dining Philosophers', 'Readers-Writers'], priority: 'High' },
        { title: 'Deadlock Characterization & Prevention', unit: 'Unit 3: Synchronization & Deadlocks', description: 'Coffman four conditions, resource allocation graphs, prevention rules', subtopics: ['Mutual Exclusion', 'Hold & Wait', 'Circular Wait'], priority: 'High' },
        { title: 'Deadlock Avoidance & Banker’s Algorithm', unit: 'Unit 3: Synchronization & Deadlocks', description: 'Safe state evaluation, resource-request algorithm, Banker’s safety algorithm', subtopics: ['Safe States', 'Banker Algorithm', 'Deadlock Detection'], priority: 'High' },
        { title: 'Main Memory Management & Address Binding', unit: 'Unit 4: Memory Management', description: 'Logical vs physical addresses, MMU, static vs dynamic linking', subtopics: ['Address Binding', 'MMU Translation', 'Swapping'], priority: 'Medium' },
        { title: 'Contiguous Allocation & Fragmentation', unit: 'Unit 4: Memory Management', description: 'First fit, best fit, worst fit strategies, internal vs external fragmentation', subtopics: ['Allocation Strategies', 'Compaction', 'Fragmentation'], priority: 'Medium' },
        { title: 'Paging & Page Tables (TLB)', unit: 'Unit 4: Memory Management', description: 'Page table structure, Translation Lookaside Buffer, multilevel paging', subtopics: ['Paging Scheme', 'TLB Hit Ratio', 'Inverted Page Tables'], priority: 'High' },
        { title: 'Segmentation Architecture', unit: 'Unit 4: Memory Management', description: 'Segment table, segmentation with paging, user perspective memory model', subtopics: ['Segment Tables', 'Protection & Sharing'], priority: 'Medium' },
        { title: 'Virtual Memory & Demand Paging', unit: 'Unit 4: Memory Management', description: 'Page fault handling routine, valid-invalid bit, swap space interactions', subtopics: ['Demand Paging', 'Page Fault Handling', 'Thrashing'], priority: 'High' },
        { title: 'Page Replacement Algorithms (FIFO, LRU, Optimal)', unit: 'Unit 4: Memory Management', description: 'Evaluating page faults, Belady’s anomaly, clock and second-chance algorithms', subtopics: ['LRU Replacement', 'Belady Anomaly', 'Clock Algorithm'], priority: 'High' },
        { title: 'File System Interface & Directory Structure', unit: 'Unit 5: Storage & Protection', description: 'File attributes, access methods, single-level vs tree directories', subtopics: ['File Operations', 'Directory Trees', 'File Protection'], priority: 'Medium' },
        { title: 'File System Implementation & Allocation Methods', unit: 'Unit 5: Storage & Protection', description: 'Contiguous, linked, and indexed allocation, inode data structures', subtopics: ['Contiguous Allocation', 'Linked Allocation', 'Inodes'], priority: 'High' },
        { title: 'Disk Scheduling Algorithms (FCFS, SSTF, SCAN, LOOK)', unit: 'Unit 5: Storage & Protection', description: 'Disk arm movement optimization, seek time calculations', subtopics: ['SSTF Scheduling', 'SCAN & C-SCAN', 'LOOK & C-LOOK'], priority: 'High' },
      ];
    }

    if (/data structure|dsa|algorithm/i.test(sName)) {
      return [
        { title: 'Asymptotic Analysis & Big-O Notation', unit: 'Unit 1: Fundamentals & Arrays', description: 'Time and space complexity, best/worst/average case bounds', subtopics: ['Big-O, Omega, Theta', 'Space Complexity'], priority: 'High' },
        { title: 'Arrays & Matrix Operations', unit: 'Unit 1: Fundamentals & Arrays', description: 'Static vs dynamic arrays, multi-dimensional array mappings', subtopics: ['Array Traversals', 'Matrix Multiplication'], priority: 'Medium' },
        { title: 'Singly, Doubly & Circular Linked Lists', unit: 'Unit 1: Fundamentals & Arrays', description: 'Node pointers, insertions, deletions, reversing a linked list', subtopics: ['Singly Linked List', 'Doubly Linked List', 'Pointer Manipulation'], priority: 'High' },
        { title: 'Stack Implementation & Applications', unit: 'Unit 2: Stacks, Queues & Recursion', description: 'LIFO principle, infix to postfix conversion, balanced parenthesis', subtopics: ['Stack via Array/LL', 'Expression Parsing', 'Function Call Stack'], priority: 'High' },
        { title: 'Queues, Deques & Priority Queues', unit: 'Unit 2: Stacks, Queues & Recursion', description: 'FIFO operations, circular queue array design, double-ended queues', subtopics: ['Circular Queues', 'Deque Design', 'Queue Applications'], priority: 'Medium' },
        { title: 'Recursion & Backtracking Algorithms', unit: 'Unit 2: Stacks, Queues & Recursion', description: 'Base cases, recursive trees, N-Queens problem, subset generation', subtopics: ['Recursion Trees', 'Backtracking Framework', 'N-Queens'], priority: 'High' },
        { title: 'Hashing & Collision Resolution', unit: 'Unit 2: Stacks, Queues & Recursion', description: 'Hash functions, separate chaining, open addressing (linear/quadratic probing)', subtopics: ['Hash Maps', 'Chaining', 'Open Addressing'], priority: 'High' },
        { title: 'Binary Trees & Traversals (Inorder, Preorder, Postorder)', unit: 'Unit 3: Trees & Hierarchical Structures', description: 'Tree properties, recursive and iterative traversals, level-order traversal', subtopics: ['DFS Traversals', 'BFS Level Order', 'Tree Height/Depth'], priority: 'High' },
        { title: 'Binary Search Trees (BST)', unit: 'Unit 3: Trees & Hierarchical Structures', description: 'BST invariant, search, insert, delete node algorithms, predecessor/successor', subtopics: ['BST Search/Insert', 'BST Node Deletion', 'Lowest Common Ancestor'], priority: 'High' },
        { title: 'Self-Balancing Trees (AVL Trees & Red-Black Trees)', unit: 'Unit 3: Trees & Hierarchical Structures', description: 'Balance factors, LL/RR/LR/RL rotations, guaranteed O(log n) operations', subtopics: ['AVL Rotations', 'Red-Black Properties'], priority: 'High' },
        { title: 'Binary Heaps & Heap Sort', unit: 'Unit 3: Trees & Hierarchical Structures', description: 'Min-heap, max-heap, heapify algorithm, priority queue implementations', subtopics: ['Heapify Process', 'Heap Sort', 'Priority Queue Ops'], priority: 'High' },
        { title: 'Graph Representations (Adjacency Matrix vs List)', unit: 'Unit 4: Graph Algorithms', description: 'Space/time tradeoffs, directed vs undirected, weighted graphs', subtopics: ['Adjacency Lists', 'Degree Calculations'], priority: 'Medium' },
        { title: 'Breadth-First Search (BFS) & Depth-First Search (DFS)', unit: 'Unit 4: Graph Algorithms', description: 'Queue/stack traversals, connected components, cycle detection in graphs', subtopics: ['BFS Traversal', 'DFS Traversal', 'Cycle Detection'], priority: 'High' },
        { title: 'Shortest Path Algorithms (Dijkstra & Bellman-Ford)', unit: 'Unit 4: Graph Algorithms', description: 'Single-source shortest path, greedy selection, negative cycle handling', subtopics: ['Dijkstra Algorithm', 'Bellman-Ford Algorithm', 'DAG Shortest Path'], priority: 'High' },
        { title: 'Minimum Spanning Trees (Prim’s & Kruskal’s)', unit: 'Unit 4: Graph Algorithms', description: 'Cut property, Disjoint Set Union (DSU), greedy edge selection', subtopics: ['Kruskal via DSU', 'Prim Algorithm'], priority: 'High' },
        { title: 'Divide and Conquer (Merge Sort & Quick Sort)', unit: 'Unit 5: Advanced Algorithmic Paradigms', description: 'Partitioning, recurrence relations, Master Theorem analysis', subtopics: ['Merge Sort', 'Quick Sort Partitioning', 'Master Theorem'], priority: 'High' },
        { title: 'Dynamic Programming (Memoization & Tabulation)', unit: 'Unit 5: Advanced Algorithmic Paradigms', description: 'Overlapping subproblems, optimal substructure, 0/1 Knapsack, LCS', subtopics: ['0/1 Knapsack', 'Longest Common Subsequence', 'Coin Change'], priority: 'High' },
        { title: 'Greedy Algorithms (Activity Selection & Huffman Coding)', unit: 'Unit 5: Advanced Algorithmic Paradigms', description: 'Greedy-choice property, optimal prefix codes, interval scheduling', subtopics: ['Activity Selection', 'Huffman Compression'], priority: 'Medium' },
      ];
    }

    if (/dbms|database/i.test(sName)) {
      return [
        { title: 'Database System Architecture & Three-Schema Schema', unit: 'Unit 1: Relational Foundations', description: 'Physical, logical, and external levels, data independence', subtopics: ['Data Independence', 'DBMS vs File Systems'], priority: 'Medium' },
        { title: 'Entity-Relationship (ER) & Enhanced ER Modeling', unit: 'Unit 1: Relational Foundations', description: 'Entities, relationships, cardinality ratios, ER to Relational schema mapping', subtopics: ['ER Diagrams', 'Attributes & Keys', 'Mapping to Tables'], priority: 'High' },
        { title: 'Relational Model & Relational Algebra Operators', unit: 'Unit 1: Relational Foundations', description: 'Select, project, join, union, set difference, Cartesian product', subtopics: ['Relational Algebra', 'Tuple Relational Calculus'], priority: 'High' },
        { title: 'SQL DDL, DML & Integrity Constraints', unit: 'Unit 2: SQL & Query Design', description: 'Primary keys, foreign keys, check constraints, cascade updates', subtopics: ['Table Creation', 'Foreign Keys', 'Data Modification'], priority: 'High' },
        { title: 'Complex Queries, Nested Subqueries & Joins', unit: 'Unit 2: SQL & Query Design', description: 'Inner, left, right, full outer joins, correlated subqueries, group by, having', subtopics: ['Join Types', 'Subqueries', 'Aggregate Functions'], priority: 'High' },
        { title: 'Views, Triggers & Stored Procedures', unit: 'Unit 2: SQL & Query Design', description: 'Updatable views, event-driven triggers, procedural extensions', subtopics: ['Database Triggers', 'Stored Procedures', 'Security Views'], priority: 'Medium' },
        { title: 'Functional Dependencies & Closure of Attributes', unit: 'Unit 3: Normalization & Schema Design', description: 'Armstrong’s axioms, finding candidate keys, canonical cover', subtopics: ['Functional Dependencies', 'Attribute Closure', 'Candidate Keys'], priority: 'High' },
        { title: 'Normalization Forms (1NF, 2NF, 3NF & BCNF)', unit: 'Unit 3: Normalization & Schema Design', description: 'Lossless join decomposition, dependency preservation, anomaly elimination', subtopics: ['First Normal Form', 'Second Normal Form', '3NF vs BCNF'], priority: 'High' },
        { title: 'Multi-Valued Dependencies & 4NF / 5NF', unit: 'Unit 3: Normalization & Schema Design', description: 'MVD definitions, trivial vs non-trivial dependencies, project-join normal form', subtopics: ['MVD Rules', 'Fourth Normal Form'], priority: 'Medium' },
        { title: 'Transaction Concepts & ACID Properties', unit: 'Unit 4: Transaction & Concurrency Control', description: 'Atomicity, Consistency, Isolation, Durability, transaction states', subtopics: ['ACID Model', 'Transaction States', 'Write-Ahead Logging'], priority: 'High' },
        { title: 'Serializability & Concurrency Control Protocols', unit: 'Unit 4: Transaction & Concurrency Control', description: 'Conflict vs view serializability, precedence graphs, testing serializability', subtopics: ['Conflict Serializability', 'Precedence Graphs'], priority: 'High' },
        { title: 'Lock-Based Protocols (Two-Phase Locking - 2PL)', unit: 'Unit 4: Transaction & Concurrency Control', description: 'Shared vs exclusive locks, growing/shrinking phase, strict & rigorous 2PL', subtopics: ['2PL Protocol', 'Strict 2PL', 'Lock Conversion'], priority: 'High' },
        { title: 'Deadlock Handling in Databases', unit: 'Unit 4: Transaction & Concurrency Control', description: 'Wait-for graphs, wait-die and wound-wait prevention schemes, timeout detection', subtopics: ['Wait-For Graph', 'Wait-Die & Wound-Wait'], priority: 'High' },
        { title: 'Database Recovery Protocols & Checkpoints', unit: 'Unit 4: Transaction & Concurrency Control', description: 'Deferred vs immediate database modification, checkpoint records, ARIES overview', subtopics: ['Undo/Redo Operations', 'Checkpointing', 'Crash Recovery'], priority: 'High' },
        { title: 'Indexing Techniques: B-Trees & B+ Trees', unit: 'Unit 5: Storage & Query Optimization', description: 'Primary, secondary, and clustering indexes, B+ tree insertions and deletions', subtopics: ['B+ Tree Search/Insert', 'Clustered Indexes', 'Dense vs Sparse'], priority: 'High' },
        { title: 'Hashing Techniques (Static & Dynamic Hashing)', unit: 'Unit 5: Storage & Query Optimization', description: 'Bucket overflows, extendible hashing, linear hashing', subtopics: ['Extendible Hashing', 'Directory Doubling'], priority: 'Medium' },
        { title: 'Query Processing & Cost-Based Optimization', unit: 'Unit 5: Storage & Query Optimization', description: 'Query execution plans, relational algebra equivalences, cost estimation', subtopics: ['Execution Plans', 'Join Cost Estimation'], priority: 'Medium' },
      ];
    }

    if (/network/i.test(sName)) {
      return [
        { title: 'Network Topologies & Computer Network Architectures', unit: 'Unit 1: Fundamentals & Physical Layer', description: 'Star, mesh, bus topologies, LAN/WAN/MAN, packet vs circuit switching', subtopics: ['Topologies', 'Packet Switching'], priority: 'Medium' },
        { title: 'OSI Reference Model vs TCP/IP Protocol Suite', unit: 'Unit 1: Fundamentals & Physical Layer', description: 'Seven layers of OSI, protocol data units (PDU), encapsulation/decapsulation', subtopics: ['OSI 7 Layers', 'TCP/IP 4 Layers', 'Encapsulation'], priority: 'High' },
        { title: 'Transmission Media, Multiplexing & Physical Signaling', unit: 'Unit 1: Fundamentals & Physical Layer', description: 'Twisted pair, fiber optics, FDM, TDM, WDM multiplexing techniques', subtopics: ['Guided Media', 'Multiplexing Techniques'], priority: 'Low' },
        { title: 'Data Link Layer Framing & Error Detection (CRC)', unit: 'Unit 2: Data Link & MAC Protocols', description: 'Byte/bit stuffing, parity, checksums, Cyclic Redundancy Check (CRC)', subtopics: ['Framing Methods', 'CRC Calculation', 'Hamming Codes'], priority: 'High' },
        { title: 'Flow Control & Sliding Window Protocols', unit: 'Unit 2: Data Link & MAC Protocols', description: 'Stop-and-Wait, Go-Back-N, and Selective Repeat ARQ protocols', subtopics: ['Stop-and-Wait', 'Go-Back-N', 'Selective Repeat'], priority: 'High' },
        { title: 'Medium Access Control (MAC) & CSMA/CD, CSMA/CA', unit: 'Unit 2: Data Link & MAC Protocols', description: 'ALOHA, Carrier Sense Multiple Access with Collision Detection / Avoidance', subtopics: ['CSMA/CD in Ethernet', 'CSMA/CA in Wi-Fi', 'Exponential Backoff'], priority: 'High' },
        { title: 'Ethernet & IEEE 802.11 Wireless LANs', unit: 'Unit 2: Data Link & MAC Protocols', description: 'MAC addressing, switches vs hubs, collision domains, wireless architecture', subtopics: ['MAC Addresses', 'Switches & Bridges', '802.11 Architecture'], priority: 'Medium' },
        { title: 'IPv4 Addressing, Subnetting & Supernetting (CIDR)', unit: 'Unit 3: Network Layer & Routing', description: 'Classful vs classless addressing, subnet masks, CIDR notation, variable length subnetting', subtopics: ['IPv4 Headers', 'Subnet Mask Calculation', 'CIDR Blocks'], priority: 'High' },
        { title: 'IPv6 Header Format & Transition Mechanisms', unit: 'Unit 3: Network Layer & Routing', description: '128-bit addresses, base vs extension headers, dual-stack, tunneling', subtopics: ['IPv6 Addresses', 'Extension Headers', 'Dual Stack'], priority: 'Medium' },
        { title: 'Routing Algorithms: Distance Vector & Link State', unit: 'Unit 3: Network Layer & Routing', description: 'Bellman-Ford, count-to-infinity problem, Dijkstra algorithm in OSPF', subtopics: ['Distance Vector (RIP)', 'Link State (OSPF)', 'Dijkstra Routing'], priority: 'High' },
        { title: 'Network Control Protocols: ARP, ICMP, DHCP & NAT', unit: 'Unit 3: Network Layer & Routing', description: 'Address resolution, ping/traceroute messages, dynamic host config, port address translation', subtopics: ['ARP Cache', 'ICMP Types', 'DHCP Lease', 'NAT/PAT'], priority: 'High' },
        { title: 'Transport Layer & UDP Protocol', unit: 'Unit 4: Transport Layer Protocols', description: 'Process-to-process delivery, port numbers, UDP header and connectionless operations', subtopics: ['Port Numbers', 'UDP Header Format', 'Best-Effort Delivery'], priority: 'Medium' },
        { title: 'TCP Connection Management (3-Way Handshake & Termination)', unit: 'Unit 4: Transport Layer Protocols', description: 'SYN, ACK, FIN flags, sequence numbers, TCP state diagram', subtopics: ['3-Way Handshake', '4-Way Termination', 'TIME_WAIT State'], priority: 'High' },
        { title: 'TCP Flow Control & Congestion Control', unit: 'Unit 4: Transport Layer Protocols', description: 'Sliding window, Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery', subtopics: ['Congestion Window (cwnd)', 'Slow Start Threshold', 'AIMD'], priority: 'High' },
        { title: 'Application Layer: DNS & Domain Resolution', unit: 'Unit 5: Application Layer & Security', description: 'Hierarchical namespace, recursive vs iterative queries, DNS caching and record types', subtopics: ['DNS Hierarchy', 'Iterative Queries', 'A, CNAME, MX Records'], priority: 'High' },
        { title: 'HTTP/1.1, HTTP/2, HTTP/3 & Web Caching', unit: 'Unit 5: Application Layer & Security', description: 'Request/response headers, status codes, multiplexing, persistent connections', subtopics: ['HTTP Methods & Headers', 'Multiplexing', 'Cookies & Sessions'], priority: 'High' },
        { title: 'Network Security, SSL/TLS & Cryptography Basics', unit: 'Unit 5: Application Layer & Security', description: 'Symmetric vs asymmetric encryption, digital certificates, TLS handshake, firewalls', subtopics: ['TLS Handshake', 'Public Key Infrastructure', 'Firewalls'], priority: 'High' },
      ];
    }

    // Dynamic Academic General Curriculum for any user-provided subject
    const titleClean = (subjectName || 'Course').trim();
    return [
      { title: `Introduction, Scope & Foundations of ${titleClean}`, unit: 'Unit 1: Fundamentals & Core Architecture', description: `Overview, historical context, fundamental principles and design paradigms of ${titleClean}.`, subtopics: ['Introduction & Overview', 'Basic Terminology', 'System Architecture'], priority: 'High' },
      { title: `Core Concepts, Models & Frameworks in ${titleClean}`, unit: 'Unit 1: Fundamentals & Core Architecture', description: `Theoretical foundations, basic abstractions, and mathematical/logical formalisms.`, subtopics: ['Core Definitions', 'Standard Models', 'Taxonomy'], priority: 'Medium' },
      { title: `Fundamental Components & Structural Organization`, unit: 'Unit 1: Fundamentals & Core Architecture', description: `Structural modules, dependencies, and inter-component workflows.`, subtopics: ['System Components', 'Interface Contracts'], priority: 'Medium' },
      { title: `Primary Methodologies & Operational Procedures`, unit: 'Unit 2: Key Principles & Processing', description: `Standard procedures, algorithms, lifecycle workflows and processing models.`, subtopics: ['Methodologies', 'Operational Workflows'], priority: 'High' },
      { title: `Core Techniques & Algorithmic Foundations`, unit: 'Unit 2: Key Principles & Processing', description: `Essential problem-solving mechanisms, mathematical operations, and computational rules.`, subtopics: ['Problem Solving', 'Algorithmic Steps', 'Complexity'], priority: 'High' },
      { title: `Configuration, Setup & Execution Workflows`, unit: 'Unit 2: Key Principles & Processing', description: `Practical pipeline configuration, setup parameters, and runtime environments.`, subtopics: ['Configuration Rules', 'Runtime Lifecycle'], priority: 'Medium' },
      { title: `Core System Implementation & Engineering Design`, unit: 'Unit 3: Implementation & Analysis', description: `Modular implementation patterns, encapsulation, and engineering best practices.`, subtopics: ['Design Patterns', 'Implementation Strategies'], priority: 'High' },
      { title: `Data Handling, Storage & State Management`, unit: 'Unit 3: Implementation & Analysis', description: `Techniques for structuring, persisting, querying, and managing system data and state.`, subtopics: ['Data Structures', 'Persistence', 'State Synchronization'], priority: 'High' },
      { title: `Optimization, Efficiency & Performance Tuning`, unit: 'Unit 3: Implementation & Analysis', description: `Benchmarking, bottlenecks identification, resource optimization, and scalability tuning.`, subtopics: ['Performance Metrics', 'Bottleneck Resolution'], priority: 'High' },
      { title: `Integration, Communication & Protocol Standards`, unit: 'Unit 4: Advanced Systems & Integration', description: `System interfaces, external protocol compliance, and networked interactions.`, subtopics: ['Protocols & APIs', 'Inter-service Communication'], priority: 'Medium' },
      { title: `Fault Tolerance, Error Handling & Diagnostics`, unit: 'Unit 4: Advanced Systems & Integration', description: `Exception handling architectures, logging, recovery strategies, and resilience.`, subtopics: ['Error Handling', 'Logging & Diagnostics', 'Recovery'], priority: 'High' },
      { title: `Advanced Concepts & Complex Problem Formulations`, unit: 'Unit 4: Advanced Systems & Integration', description: `High-level abstractions, distributed considerations, and advanced application scenarios.`, subtopics: ['Advanced Topics', 'Scale Considerations'], priority: 'High' },
      { title: `Security, Validation, Authentication & Privacy`, unit: 'Unit 5: Security, Testing & Modern Trends', description: `Security vulnerabilities, defense mechanisms, access control, and compliance.`, subtopics: ['Threat Modeling', 'Verification & Validation'], priority: 'High' },
      { title: `Testing, Quality Assurance & Verification Standards`, unit: 'Unit 5: Security, Testing & Modern Trends', description: `Unit testing, integration testing, boundary cases, and quality benchmarks.`, subtopics: ['Test Cases', 'Validation Metrics'], priority: 'Medium' },
      { title: `Emerging Trends, Industry Case Studies & Future Directions`, unit: 'Unit 5: Security, Testing & Modern Trends', description: `Current technological advancements, case studies, and future innovations in ${titleClean}.`, subtopics: ['Modern Case Studies', 'Emerging Technologies'], priority: 'Medium' },
    ];
  }

  /**
   * Extract or generate topics from syllabus text or subject name with AI support and reliable curriculum fallback
   */
  async extractTopicsFromSyllabus(rawText, subjectName = '') {
    const sName = (subjectName || '').trim();
    const hasText = typeof rawText === 'string' && rawText.trim().length >= 15;

    // Local parse of text if provided
    let fallbackTopics = hasText ? this.parseSyllabusRules(rawText) : [];

    // If no text or text produced no topics, use comprehensive curriculum for the subject
    if (fallbackTopics.length === 0) {
      fallbackTopics = this.getStandardSubjectTopics(sName).map((t, idx) => ({
        ...t,
        status: 'Not Started',
        order: idx + 1,
      }));
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return fallbackTopics;
    }

    try {
      const model = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
      const prompt = hasText
        ? `You are a university academic curriculum parser. Extract clean, individual study topics from the following syllabus text for the subject "${sName || 'Course'}".
Output valid JSON ONLY in this format:
{
  "topics": [
    {
      "title": "Topic Name (clean, concise, 2-120 chars)",
      "unit": "Unit/Chapter name if identifiable, or empty",
      "description": "Short 1-sentence description or subtopics covered",
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "priority": "High" | "Medium" | "Low"
    }
  ]
}
Rules:
- Break broad units into distinct, manageable study topics.
- Priority should be "High", "Medium", or "Low".
- Maximum 30 topics.

Syllabus Text:
${rawText.slice(0, 5000)}
`
        : `You are a university academic professor and curriculum designer. Generate a comprehensive, high-quality university syllabus curriculum with 15 to 25 essential study topics for the subject "${sName}".
Organize the topics across academic units (Unit 1: Foundations, Unit 2: Core Concepts, Unit 3: Architecture & Mechanisms, Unit 4: Systems & Implementation, Unit 5: Advanced & Security).
Output valid JSON ONLY in this format:
{
  "topics": [
    {
      "title": "Topic Name (clean, concise, 2-120 chars)",
      "unit": "Unit Name",
      "description": "1-sentence summary of what is covered in this topic",
      "subtopics": ["Subtopic 1", "Subtopic 2"],
      "priority": "High" | "Medium" | "Low"
    }
  ]
}
`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = JSON.parse(candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim());
          const list = Array.isArray(parsed) ? parsed : (parsed.topics || []);
          if (Array.isArray(list) && list.length > 0) {
            return list
              .filter((t) => t.title && t.title.trim().length >= 2)
              .map((t, idx) => ({
                title: t.title.trim().slice(0, 120),
                unit: (t.unit || '').trim().slice(0, 120),
                description: (t.description || '').trim().slice(0, 300),
                subtopics: Array.isArray(t.subtopics) ? t.subtopics.map(s => String(s).trim()).filter(Boolean) : [],
                priority: ['Low', 'Medium', 'High'].includes(t.priority) ? t.priority : 'Medium',
                status: 'Not Started',
                order: idx + 1,
              }));
          }
        }
      }
    } catch (err) {
      console.warn('[TopicService] AI extraction fallback to built-in curriculum:', err.message);
    }

    return fallbackTopics;
  }

  /**
   * Bulk create topics for a subject
   */
  async bulkCreateTopics(userId, subjectId, data) {
    await this.verifySubjectOwnership(userId, subjectId);

    let topicList = [];
    if (Array.isArray(data.topics) && data.topics.length > 0) {
      topicList = data.topics;
    } else if (typeof data.syllabusText === 'string' && data.syllabusText.trim()) {
      topicList = this.parseSyllabusRules(data.syllabusText);
    }

    if (!topicList || topicList.length === 0) {
      const error = new Error('No valid topics provided or extracted from syllabus.');
      error.statusCode = 400;
      throw error;
    }

    // Fetch existing topics for this subject to prevent duplicates
    const existingTopics = await Topic.find({ user: userId, subject: subjectId }).select('title');
    const existingTitles = new Set(existingTopics.map((t) => t.title.trim().toLowerCase()));

    const toInsert = [];
    const skipped = [];
    const batchSeen = new Set();

    let orderCounter = existingTopics.length + 1;

    for (const item of topicList) {
      const rawTitle = typeof item === 'string' ? item : item.title;
      if (!rawTitle) continue;
      const cleanTitle = rawTitle.trim();
      if (cleanTitle.length < 2) continue;

      const lower = cleanTitle.toLowerCase();
      if (existingTitles.has(lower) || batchSeen.has(lower)) {
        skipped.push(cleanTitle);
        continue;
      }

      batchSeen.add(lower);
      toInsert.push({
        user: userId,
        subject: subjectId,
        title: cleanTitle.slice(0, 120),
        unit: (item.unit || '').trim().slice(0, 120),
        description: (item.description || '').trim().slice(0, 500),
        subtopics: Array.isArray(item.subtopics) ? item.subtopics : [],
        priority: ['Low', 'Medium', 'High'].includes(item.priority) ? item.priority : 'Medium',
        status: item.status || 'Not Started',
        order: Number(item.order) || orderCounter++,
      });
    }

    if (toInsert.length === 0) {
      return {
        count: 0,
        created: [],
        skipped,
        message: 'All topics already exist in this subject.',
      };
    }

    const createdTopics = await Topic.insertMany(toInsert);

    return {
      count: createdTopics.length,
      created: createdTopics.map((t) => t.toSafeObject()),
      skipped,
    };
  }
}

module.exports = new TopicService();
