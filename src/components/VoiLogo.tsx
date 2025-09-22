import voiLogo from '@/assets/voi-logo.jpeg';

interface VoiLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const VoiLogo = ({ className = '', size = 'md' }: VoiLogoProps) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto'
  };

  return (
    <img 
      src={voiLogo} 
      alt="Voi Network" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default VoiLogo;