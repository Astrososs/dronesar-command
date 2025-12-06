# SAR(Serach And Rescue) 👁️
**Tactical AI for Disaster Response | NVIDIA VSS Hackathon Submission**

![Status](https://img.shields.io/badge/Status-Prototype-76b900)
![Tech](https://img.shields.io/badge/Powered%20By-NVIDIA%20VSS-76b900)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎥 Project Demo
[![Watch the Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID_HERE/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID_HERE)
*(Click the image above to watch our prototype in action)*

---

## 🚨 The Problem
In disaster scenarios, rescue commanders are overwhelmed by **"data blindness."**
* **Cognitive Overload:** Human operators fatigue after 20 minutes of monitoring drone feeds.
* **Subjectivity:** Risk assessment varies by person and stress level.
* **Missed Details:** Critical clues—like a victim trapped under rubble—are often missed in the visual noise.

## 🛡️ The Solution
**SAR** is a Physical AI agent that turns raw video chaos into a structured **Tactical SITREP**. It doesn't just "watch" video; it reasons about the physical environment using a **2-Layer Logic System**:

1.  **Layer 1: Threat Assessment** (Detects Fire, Smoke Flow, Structural Instability)
2.  **Layer 2: Human Status** (Distinguishes between **Rescuers in PPE** and **Vulnerable Victims**)
---

## 🏗️ Architecture & Data Flow

```mermaid
graph TD
    A[Drone Video Feed] --> B(NVIDIA VSS Blueprint)
    B --> C{Tactical Analyst Agent}
    C -->|Layer 1| D[Threat Detection]
    C -->|Layer 2| E[Human & PPE Detection]
    D & E --> G[SAR Dashboard]
    G --> H[Incident Commander]

    style B fill:#76b900,color:#fff
    style G fill:#ff3b30,color:#fff
