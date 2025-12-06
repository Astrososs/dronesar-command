graph TD
    A[Drone Video Feed] -->|RTSP Stream| B(NVIDIA VSS Blueprint)
    B -->|Vector Indexing| C{Tactical Analyst Agent}
    C -->|Layer 1 Scan| D[Threat Detection]
    C -->|Layer 2 Scan| E[Human & PPE Detection]
    C -->|Layer 3 Scan| F[Logistics & Access]
    D & E & F -->|Synthesized JSON| G[Command Sight Dashboard]
    G -->|Alerts & SITREP| H[Incident Commander]
    
    style B fill:#76b900,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#ff3b30,stroke:#333,stroke-width:2px,color:#fff
