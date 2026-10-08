import React, { useState } from "react";
import "../styles/FloatingTransportDock.css";

export default function FloatingTransportDock({
  currentStep = 0,
  totalSteps = 0,
  onStepOver,
  onStepBack,
  onStepIn,
  onStepOut,
  onJumpToStep,
  isPlaying = false,
  onTogglePlay,
  speed = 800,
  onSpeedChange,
  stepLoading = false,
  atEnd = false,
  pausedAtBp = false,
  layoutMode = "split",
  onLayoutModeChange,
  showLayoutPicker = true,
}) {
  const [minimized, setMinimized] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const speedOptions = [
    { label: "0.5x", val: 1500 },
    { label: "1x",   val: 800 },
    { label: "2x",   val: 400 },
    { label: "4x",   val: 180 },
  ];

  if (minimized) {
    return (
      <aside className="dock-minimized-pill" aria-label="Execution Dock controls">
        <button
          className="dock-restore-btn"
          onClick={() => setMinimized(false)}
          title="Restore Execution Dock"
        >
          <span className="material-symbols-outlined">tune</span>
          <span className="dock-restore-text">
            Step {currentStep + 1}/{Math.max(totalSteps, 1)}
          </span>
          <span className="material-symbols-outlined chevron">expand_less</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="floating-transport-dock" aria-label="Interactive Debugger Transport Dock">
      {/* ── Status Indicator & Scrubber Row ── */}
      <div className="dock-scrubber-row">
        <div className="dock-status-pill">
          {pausedAtBp ? (
            <span className="dock-badge dock-badge-bp">
              <span className="dock-pulse-dot bp-pulse" />
              Breakpoint Hit
            </span>
          ) : isPlaying ? (
            <span className="dock-badge dock-badge-running">
              <span className="dock-pulse-dot run-pulse" />
              Stepping
            </span>
          ) : atEnd ? (
            <span className="dock-badge dock-badge-ended">
              <span className="material-symbols-outlined check-icon">check_circle</span>
              Finished
            </span>
          ) : (
            <span className="dock-badge dock-badge-paused">
              <span className="dock-pulse-dot" />
              Ready
            </span>
          )}
          <span className="dock-step-counter">
            Step <strong>{currentStep + 1}</strong> of <strong>{Math.max(totalSteps, 1)}</strong>
          </span>
        </div>

        {/* Step Slider / Scrubber */}
        {totalSteps > 1 && (
          <div className="dock-slider-wrap">
            <input
              type="range"
              min={0}
              max={Math.max(totalSteps - 1, 0)}
              value={currentStep}
              onChange={(e) => onJumpToStep && onJumpToStep(Number(e.target.value))}
              disabled={isPlaying || stepLoading}
              className="dock-slider"
              title={`Jump to step ${currentStep + 1}`}
            />
          </div>
        )}

        {/* Minimize Button */}
        <button
          className="dock-icon-btn dock-btn-minimize"
          onClick={() => setMinimized(true)}
          title="Minimize dock"
        >
          <span className="material-symbols-outlined">expand_more</span>
        </button>
      </div>

      {/* ── Main Controls Row ── */}
      <div className="dock-controls-row">
        {/* Step Navigation Group */}
        <div className="dock-btn-group dock-transport-group">
          {/* Reset / Step 0 */}
          <button
            className="dock-btn"
            onClick={() => onJumpToStep && onJumpToStep(0)}
            disabled={currentStep === 0 || isPlaying || stepLoading}
            title="Reset to start (Step 1)"
          >
            <span className="material-symbols-outlined">first_page</span>
          </button>

          {/* Step Back */}
          <button
            className="dock-btn"
            onClick={onStepBack}
            disabled={currentStep <= 0 || isPlaying || stepLoading}
            title="Step Back (←)"
          >
            <span className="material-symbols-outlined">chevron_left</span>
            <span className="dock-btn-label">Back</span>
          </button>

          {/* Play / Pause Toggle */}
          <button
            className={`dock-btn dock-btn-play${isPlaying ? " active-playing" : ""}`}
            onClick={onTogglePlay}
            disabled={atEnd && !isPlaying}
            title={isPlaying ? "Pause auto-stepping (Space)" : "Auto-step (Space)"}
          >
            <span className="material-symbols-outlined">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
            <span className="dock-btn-label">{isPlaying ? "Pause" : "Play"}</span>
          </button>

          {/* Step Over (Primary Next) */}
          <button
            className="dock-btn dock-btn-primary-step"
            onClick={onStepOver}
            disabled={atEnd || isPlaying || stepLoading}
            title="Step Over (→)"
          >
            <span className="material-symbols-outlined">chevron_right</span>
            <span className="dock-btn-label">Next</span>
          </button>

          {/* Step In */}
          {onStepIn && (
            <button
              className="dock-btn dock-btn-subtle"
              onClick={onStepIn}
              disabled={atEnd || isPlaying || stepLoading}
              title="Step In (↓)"
            >
              <span className="material-symbols-outlined">south_east</span>
              <span className="dock-btn-label">In</span>
            </button>
          )}

          {/* Step Out */}
          {onStepOut && (
            <button
              className="dock-btn dock-btn-subtle"
              onClick={onStepOut}
              disabled={atEnd || isPlaying || stepLoading}
              title="Step Out (↑)"
            >
              <span className="material-symbols-outlined">north_east</span>
              <span className="dock-btn-label">Out</span>
            </button>
          )}
        </div>

        {/* Speed Selector */}
        <div className="dock-speed-container">
          <button
            className="dock-speed-btn"
            onClick={() => setShowSpeedMenu(s => !s)}
            title="Execution speed"
          >
            <span className="material-symbols-outlined">speed</span>
            <span>{speedOptions.find(o => Math.abs(o.val - speed) < 100)?.label || `${speed}ms`}</span>
          </button>
          {showSpeedMenu && (
            <div className="dock-speed-popover">
              {speedOptions.map(opt => (
                <button
                  key={opt.val}
                  className={`dock-speed-opt${opt.val === speed ? " active" : ""}`}
                  onClick={() => {
                    onSpeedChange && onSpeedChange(opt.val);
                    setShowSpeedMenu(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="dock-divider-v" />

        {/* Layout Mode Selector */}
        {showLayoutPicker && onLayoutModeChange && (
          <div className="dock-layout-group">
            <button
              className={`dock-layout-pill${layoutMode === "split" ? " active" : ""}`}
              onClick={() => onLayoutModeChange("split")}
              title="Studio Split (Classic 2-Column)"
            >
              <span className="material-symbols-outlined">view_column</span>
              <span>Split</span>
            </button>

            <button
              className={`dock-layout-pill${layoutMode === "quad" ? " active" : ""}`}
              onClick={() => onLayoutModeChange("quad")}
              title="Quad Quantum Studio (4-Pane Multi-Grid)"
            >
              <span className="material-symbols-outlined">grid_view</span>
              <span>Quad</span>
            </button>

            <button
              className={`dock-layout-pill${layoutMode === "canvas" ? " active" : ""}`}
              onClick={() => onLayoutModeChange("canvas")}
              title="Flow Cinema (Full Visualizer Canvas)"
            >
              <span className="material-symbols-outlined">fullscreen</span>
              <span>Cinema</span>
            </button>

            <button
              className={`dock-layout-pill${layoutMode === "zen" ? " active" : ""}`}
              onClick={() => onLayoutModeChange("zen")}
              title="Zen Focus (Maximized Code Editor)"
            >
              <span className="material-symbols-outlined">code</span>
              <span>Zen</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
