import { useTranslation } from 'react-i18next';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import clsx from 'clsx';
import { useState } from 'react';

interface ExpandableTextProps {
  value?: string;
}

export function ExpandableText({ value, ...props }: ExpandableTextProps) {
  if (!value) return <></>;

  const [open, setOpen] = useState(false);

  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const segments = Array.from(segmenter.segment(value)).map((s) => s.segment);

  if (segments.length <= 2) {
    return <p {...props}>{value}</p>;
  }

  const initialText = segments.slice(0, 2).join(' ');
  const remainingText = segments.slice(2).join(' ');

  return (
    <Collapsible {...props} open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="text-left">
        {initialText}
        <span className={clsx({ hidden: !open })}>{remainingText}</span>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
