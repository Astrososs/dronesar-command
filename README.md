```mermaid
graph TD
    A[Drone Video Feed] --> B(NVIDIA VSS Blueprint)
    B --> C{Tactical Analyst Agent}
    C -->|Layer 1| D[Threat Detection]
    C -->|Layer 2| E[Human & PPE Detection]
    C -->|Layer 3| F[Logistics & Access]
    D & E & F --> G[Command Sight Dashboard]
    G --> H[Incident Commander]

    style B fill:#76b900,color:#fff
    style G fill:#ff3b30,color:#fff
