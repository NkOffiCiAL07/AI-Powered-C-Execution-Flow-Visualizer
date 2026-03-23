# Interactive Debugger API & Architecture Plan

## 1) Product Goal
Build an interactive backend service that lets users control a running C++ debug session in real time and receive UI-ready state updates for animations.

Core user actions:
- View current execution state
- Step over / step in / step out
- Continue / pause / stop
- Jump to a historical step for timeline replay

---

## 2) Target UX Flow
1. User submits source code + optional input.
2. Backend compiles code and reports diagnostics.
3. User starts debug session.
4. UI sends controls (`step`, `continue`, `pause`, etc.).
5. Backend streams state updates after each execution event.
6. UI animates code cursor, stack transitions, and variable diffs.

---

## 3) High-Level Architecture

### Components
- **API Layer (FastAPI)**
  - Session APIs, command APIs, timeline APIs
  - WebSocket endpoint for live events
- **Execution Orchestrator**
  - Owns session lifecycle and command dispatch
  - Coordinates debugger adapter and state store
- **Debugger Adapter Layer**
  - `LLDBAdapter` (primary for macOS)
  - `GDBAdapter` (secondary, Linux-ready)
  - Shared interface for portability
- **State Store**
  - In-memory per session (MVP)
  - Optional Redis persistence later
- **Compiler/Runtime Worker**
  - Build and run in isolated process/container
  - Applies resource limits and timeouts

### Data Flow
`Client -> API -> Orchestrator -> Debugger Adapter -> State/Diff -> API -> Client`

---

## 4) Session State Machine

`CREATED -> COMPILED -> READY -> RUNNING <-> PAUSED -> EXITED`

Error states:
- `COMPILE_ERROR`
- `RUNTIME_ERROR`
- `TIMEOUT`
- `KILLED`

Command validity:
- `STEP_*` only in `PAUSED`
- `CONTINUE` only in `PAUSED`
- `PAUSE` only in `RUNNING`
- `STOP` allowed in `RUNNING`/`PAUSED`

---

## 5) Core Domain Models

## 5.1 Session
- `session_id`
- `status`
- `backend` (`lldb`/`gdb`)
- `created_at`, `updated_at`
- `source_meta` (filename, language)

## 5.2 StepState
- `step_no`
- `location` (`file`, `line`, `function`)
- `locals`
- `call_stack`
- `stdout_delta`
- `stderr_delta`
- `timestamp`

## 5.3 StateDiff
- `line_changed`
- `entered_function` / `returned_function`
- `changed_variables` (name, old, new)
- `output_appended`

## 5.4 Command
- `type`: `STEP_OVER`, `STEP_IN`, `STEP_OUT`, `CONTINUE`, `PAUSE`, `STOP`, `SEEK_STEP`
- `session_id`
- `payload` (e.g., target step number)

---

## 6) API Design (MVP)

## 6.1 Session + Build APIs
- `POST /sessions`
  - Create session from source and config
- `POST /sessions/{id}/compile`
  - Compile and return diagnostics
- `POST /sessions/{id}/start`
  - Start debugger and pause at entry/main

## 6.2 Control APIs
- `POST /sessions/{id}/commands`
  - Send command (`step`, `continue`, etc.)
  - Returns accepted/rejected + current status

## 6.3 Read APIs
- `GET /sessions/{id}/state`
  - Latest execution state
- `GET /sessions/{id}/steps/{step_no}`
  - Exact historical state
- `GET /sessions/{id}/timeline?from=0&limit=100`
  - Batched timeline for replay/scrubber

## 6.4 Realtime API
- `WS /sessions/{id}/events`
  - Push event types:
    - `state_updated`
    - `paused`
    - `resumed`
    - `exited`
    - `error`

---

## 7) Event Contract for Animations
Frontend should animate from explicit backend event payloads.

Each state event should include:
- `event_type`
- `session_id`
- `step_no`
- `state` (full or compact)
- `diff` (line/stack/variables/output changes)

Animation mapping examples:
- Line change -> move code cursor animation
- Variable changed -> pulse/highlight changed row
- Stack push/pop -> function enter/return transition
- Output delta -> terminal append animation

Principle: animation must be deterministic from event payload, not inferred heuristically.

---

## 8) Execution & Safety Requirements

## 8.1 Process isolation
- Isolated working dir per session
- Separate process group per debug session

## 8.2 Limits
- Compile timeout
- Run timeout
- Max steps per session
- Memory and output caps

## 8.3 Cleanup
- Ensure debugger process termination on stop/timeout/disconnect
- Remove temp files and stale sessions

---

## 9) Storage Strategy

MVP:
- In-memory session registry
- In-memory step history list

Next:
- Redis for distributed session state and event fanout
- Optional durable timeline store for long replays

---

## 10) Suggested Folder Layout (Server)

```text
src/flowviz/server/
  app.py
  api/
    sessions.py
    commands.py
    timeline.py
    ws.py
  core/
    orchestrator.py
    session_manager.py
    state_store.py
    diff_engine.py
    models.py
  adapters/
    base.py
    lldb_adapter.py
    gdb_adapter.py
  workers/
    compiler.py
    sandbox.py
```

---

## 11) Phased Implementation Plan

### Phase 1 — Contracts + Skeleton
- Define Pydantic models for session/state/diff/command
- Add FastAPI app with health and placeholder routes
- Add orchestrator/session manager interfaces

### Phase 2 — Session Control Core
- Implement `POST /sessions`, `/compile`, `/start`, `/commands`
- Wire LLDB adapter into orchestrator
- Maintain in-memory latest state per session

### Phase 3 — Timeline + Realtime
- Persist every `StepState`
- Add `/steps/{n}` and `/timeline`
- Add WebSocket `events` stream

### Phase 4 — Diff Engine for Animation
- Compute line/stack/variable/output diffs between steps
- Include `diff` in all state events

### Phase 5 — Hardening
- Timeouts, max-step protection, process cleanup
- Better error codes/messages
- Multi-session concurrency checks

---

## 12) Immediate Next Steps
1. Scaffold FastAPI service and route modules.
2. Define request/response schemas for all MVP endpoints.
3. Implement session manager + in-memory timeline store.
4. Integrate existing LLDB execution loop behind adapter interface.
5. Add one vertical slice end-to-end:
   - create session -> compile -> start -> step -> get latest state -> receive WS event.
