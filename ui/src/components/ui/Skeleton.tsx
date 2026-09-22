import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'rounded-lg',
}) => {
  return (
    <div
      style={{ width, height }}
      className={`bg-surface animate-shimmer border border-surface-border ${rounded} ${className}`}
    />
  );
};

export const SkeletonCard: React.FC<{ height?: string }> = ({ height = 'h-32' }) => {
  return (
    <div className={`surface-card p-5 rounded-xl ${height} flex flex-col justify-between`}>
      <div className="flex items-center gap-3">
        <Skeleton width={32} height={32} rounded="rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton width="40%" height={14} />
          <Skeleton width="70%" height={10} />
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <Skeleton width="100%" height={12} />
        <Skeleton width="85%" height={12} />
      </div>
    </div>
  );
};
