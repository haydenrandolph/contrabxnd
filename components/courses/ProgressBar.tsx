'use client';

interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({
  completed,
  total,
  showLabel = true,
  size = 'md'
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const heights = {
    sm: '4px',
    md: '8px',
    lg: '12px',
  };

  return (
    <>
      <style jsx>{`
        .progress-container {
          width: 100%;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .progress-text {
          color: #8a8a8a;
        }

        .progress-percentage {
          color: #F7931A;
          font-weight: 700;
        }

        .progress-bar {
          width: 100%;
          background: #1a1a1a;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #F7931A 0%, #d4854c 100%);
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .progress-fill.complete {
          background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
        }

        :global(.light-mode) .progress-bar {
          background: #d8d4cc;
        }
      `}</style>

      <div className="progress-container">
        {showLabel && (
          <div className="progress-label">
            <span className="progress-text">{completed} of {total} lessons</span>
            <span className="progress-percentage">{percentage}%</span>
          </div>
        )}
        <div className="progress-bar" style={{ height: heights[size] }}>
          <div
            className={`progress-fill ${percentage === 100 ? 'complete' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </>
  );
}
