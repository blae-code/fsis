import React from 'react';

const CHEVRON = 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%, 10px 50%)';
const FIRST = 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)';

/** One station on the line: what sits here, how much of it, and what it is waiting on. */
export default function PipelineStage({ stage, first, onGo }) {
  const hot = stage.count > 0 && stage.hot;
  return (
    <button
      onClick={onGo}
      className="text-left px-3 py-2 min-w-0"
      style={{
        clipPath: first ? FIRST : CHEVRON,
        background: stage.count
          ? `linear-gradient(180deg,${hot ? '#241408' : '#1A1309'},#0A0806)`
          : '#090705',
        boxShadow: 'inset 0 0 0 1px #241C14',
      }}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-[10px]" style={{ color: stage.count ? '#E0A22E' : '#4A4136' }}>{stage.glyph}</span>
        <span className="text-[7px] font-bold tracking-[0.2em] truncate" style={{ color: stage.count ? '#F0E7D6' : '#6B6155' }}>
          {stage.label}
        </span>
      </div>
      <p className="text-[17px] leading-tight tabular-nums" style={{ color: hot ? '#E0A22E' : stage.count ? '#EDE5D6' : '#3A332A' }}>
        {stage.count}
      </p>
      <p className="text-[7px] tracking-[0.12em] truncate" style={{ color: hot ? '#E0A22E' : '#5F564A' }}>{stage.meta}</p>
      <p className="text-[7px] truncate" style={{ color: '#4A4136' }}>{stage.note}</p>
    </button>
  );
}