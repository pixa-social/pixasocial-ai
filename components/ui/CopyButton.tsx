
import React, { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from './Icons';
import { useToast } from './ToastProvider';

interface CopyButtonProps {
  textToCopy: string | undefined | null;
  className?: string;
  tooltipText?: string;
  size?: 'xs' | 'sm' | 'md';
  isVisible?: boolean; // To control visibility if needed, defaults to true
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  className = '',
  tooltipText = "Copy to clipboard",
  size = 'sm',
  isVisible = true,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); 
    if (!textToCopy || textToCopy.trim() === "") {
      showToast("Nothing to copy.", "info");
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      showToast("Copied to clipboard!", "success");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast("Failed to copy. Check browser permissions.", "error");
    }
  };

  if (!isVisible) {
    return null;
  }

  const iconSizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        p-1 rounded-md text-textSecondary hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-1 focus:ring-primary 
        transition-colors duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={isCopied ? "Copied!" : tooltipText}
      title={isCopied ? "Copied!" : tooltipText}
      disabled={!textToCopy || textToCopy.trim() === ""}
    >
      {isCopied ? (
        <CheckIcon className={`${iconSizeClasses[size]} text-green-500`} />
      ) : (
        <ClipboardDocumentIcon className={`${iconSizeClasses[size]}`} />
      )}
    </button>
  );
};
