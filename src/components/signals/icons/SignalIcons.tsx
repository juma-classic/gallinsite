import React from 'react';

interface IconProps {
    size?: number;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const LightningIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className, style }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        style={style}
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'
            fill={color}
            stroke={color}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const RobotIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className, style }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        style={style}
        xmlns='http://www.w3.org/2000/svg'
    >
        <rect x='3' y='11' width='18' height='10' rx='2' fill={color} />
        <circle cx='12' cy='5' r='2' fill={color} />
        <path d='M12 7v4' stroke={color} strokeWidth='2' strokeLinecap='round' />
        <circle cx='8' cy='16' r='1' fill='white' />
        <circle cx='16' cy='16' r='1' fill='white' />
        <path d='M9 1h6v2H9z' fill={color} />
    </svg>
);

export const ChartIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className, style }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        style={style}
        xmlns='http://www.w3.org/2000/svg'
    >
        <path d='M3 3v18h18' stroke={color} strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        <path
            d='M18.7 8l-5.1 5.2-2.8-2.7L7 14.3'
            stroke={color}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <circle cx='12' cy='12' r='10' stroke={color} strokeWidth='2' />
        <circle cx='12' cy='12' r='6' stroke={color} strokeWidth='2' />
        <circle cx='12' cy='12' r='2' fill={color} />
    </svg>
);

export const RocketIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z'
            fill={color}
        />
        <path
            d='M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z'
            fill={color}
        />
        <path d='M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0' fill={color} />
        <path d='M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5' fill={color} />
    </svg>
);

export const SparkleIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <path d='M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z' fill={color} />
        <path d='M8 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z' fill={color} />
        <path d='M19 16l0.5 1.5L21 18l-1.5 0.5L19 20l-0.5-1.5L17 18l1.5-0.5L19 16z' fill={color} />
    </svg>
);

export const FireIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 0 0 .9 2.2 2 3.5 1.1 1.3 2 2.5 2 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z'
            fill={color}
        />
    </svg>
);

export const TrendUpIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <polyline
            points='23 6 13.5 15.5 8.5 10.5 1 18'
            stroke={color}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <polyline
            points='17 6 23 6 23 12'
            stroke={color}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const DollarIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <line x1='12' y1='1' x2='12' y2='23' stroke={color} strokeWidth='2' strokeLinecap='round' />
        <path
            d='M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'
            stroke={color}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <circle cx='12' cy='12' r='3' stroke={color} strokeWidth='2' />
        <path
            d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z'
            stroke={color}
            strokeWidth='2'
        />
    </svg>
);

export const MobileIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <rect x='5' y='2' width='14' height='20' rx='2' ry='2' stroke={color} strokeWidth='2' />
        <line x1='12' y1='18' x2='12.01' y2='18' stroke={color} strokeWidth='2' strokeLinecap='round' />
    </svg>
);

export const PaletteIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <circle cx='13.5' cy='6.5' r='.5' fill={color} />
        <circle cx='17.5' cy='10.5' r='.5' fill={color} />
        <circle cx='8.5' cy='7.5' r='.5' fill={color} />
        <circle cx='6.5' cy='12.5' r='.5' fill={color} />
        <path
            d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z'
            stroke={color}
            strokeWidth='2'
        />
    </svg>
);

export const ExportIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        className={className}
        xmlns='http://www.w3.org/2000/svg'
    >
        <path
            d='M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4'
            stroke={color}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <polyline
            points='7 10 12 15 17 10'
            stroke={color}
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <line x1='12' y1='15' x2='12' y2='3' stroke={color} strokeWidth='2' strokeLinecap='round' />
    </svg>
);
