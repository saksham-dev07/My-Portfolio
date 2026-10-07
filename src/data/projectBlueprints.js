// Simplified architecture, checked against the linked public repositories.
export const projectBlueprints = {
  "deepfake-forensics": {
    stages: [
      [
        "Ingest",
        "React → FastAPI",
        "The console uploads media to a FastAPI gateway. Video processing extracts the evidence for analysis.",
      ],
      [
        "Analyze",
        "Parallel sensor pool",
        "Visual, frequency, biometric and audio detectors produce complementary anomaly scores in parallel.",
      ],
      [
        "Fuse",
        "Tabular ResNet",
        "A feature vector feeds the meta-classifier; Grad-CAM explains visual attention and SHAP explains feature contributions.",
      ],
      [
        "Report",
        "JSON + PDF",
        "Results return to the console, with downloadable forensic reports. These are analytical outputs, not proof of authenticity.",
      ],
    ],
    nodes: [
      [40, 80, "Console", 0],
      [140, 80, "Gateway", 0],
      [235, 32, "Visual", 1],
      [235, 80, "Physics", 1],
      [235, 128, "Audio", 1],
      [330, 80, "Fusion", 2],
      [425, 80, "Report", 3],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 6],
    ],
  },
  "nl-app-compiler": {
    stages: [
      [
        "Intent",
        "Entities + rules",
        "The first stage extracts entities, features, roles and business rules. A validation gate repairs the structured intent.",
      ],
      [
        "Design",
        "Pages + flows",
        "The second stage plans navigation, pages, relationships and flows, then validates that design.",
      ],
      [
        "Schemas",
        "Four parallel calls",
        "UI, API, database and authentication schemas are generated in parallel, then checked for required structure.",
      ],
      [
        "Refine",
        "Repair → render",
        "Cross-layer consistency checks and targeted repairs produce a configuration rendered as a standalone HTML application.",
      ],
    ],
    nodes: [
      [40, 80, "Intent", 0],
      [132, 80, "Design", 1],
      [245, 20, "UI", 2],
      [245, 60, "API", 2],
      [245, 100, "DB", 2],
      [245, 140, "Auth", 2],
      [350, 80, "Refine", 3],
      [435, 80, "HTML", 3],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [2, 6],
      [3, 6],
      [4, 6],
      [5, 6],
      [6, 7],
    ],
  },
  docpilot: {
    stages: [
      [
        "Access",
        "Firebase Auth",
        "Doctor and patient roles control access to the React application through Firebase authentication and route guards.",
      ],
      [
        "Coordinate",
        "Cloud Firestore",
        "Firestore stores clinical metadata and uses real-time listeners for queues, chat and notifications.",
      ],
      [
        "Store",
        "Appwrite Storage",
        "Large medical files are stored in Appwrite; associated record metadata lives in Firestore.",
      ],
      [
        "Assist",
        "Gemini",
        "Gemini powers the AI assistant and clinical scribe workflow. The assistant is separate from the file-storage and live-data paths.",
      ],
    ],
    nodes: [
      [50, 80, "React", 0],
      [165, 25, "Auth", 0],
      [165, 80, "Firestore", 1],
      [300, 125, "Files", 2],
      [405, 125, "Appwrite", 2],
      [300, 25, "Assistant", 3],
      [405, 25, "Gemini", 3],
    ],
    edges: [
      [0, 1],
      [0, 2],
      [2, 3],
      [3, 4],
      [0, 5],
      [5, 6],
    ],
  },
  nexusboard: {
    stages: [
      [
        "Draw",
        "Canvas 2D",
        "World-space strokes are drawn through an offscreen buffer and composited into the visible canvas.",
      ],
      [
        "Join",
        "Socket.IO rooms",
        "Clients join a room on the Node.js / Express gateway. New arrivals receive the room's existing strokes and users.",
      ],
      [
        "Relay",
        "Room events",
        "Drawing, cursor, chat and edit events are relayed between collaborators. The server keeps a bounded in-memory stroke history.",
      ],
      [
        "Recover",
        "Room state",
        "Reconnecting clients rejoin and restore the board from the server's room-state event. This is room synchronization, rather than a claimed CRDT.",
      ],
    ],
    nodes: [
      [50, 32, "Canvas A", 0],
      [50, 125, "Canvas B", 0],
      [180, 80, "Socket.IO", 1],
      [300, 80, "Room", 2],
      [410, 32, "Live events", 2],
      [410, 125, "Room state", 3],
    ],
    edges: [
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
      [4, 1],
      [3, 5],
      [5, 1],
    ],
  },
};
