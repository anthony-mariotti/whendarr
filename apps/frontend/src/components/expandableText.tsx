import { Collapsible, CollapsibleTrigger } from './ui/collapsible';
import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ExpandableTextProps {
  value?: string;
  maxLength?: number;
}

export function ExpandableText({ value, maxLength = 128, ...props }: ExpandableTextProps) {
  if (!value) return <></>;

  const { t } = useTranslation(['common']);

  const [open, setOpen] = useState(false);

  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const segments = Array.from(segmenter.segment(value)).map((s) => s.segment);

  let initialText = '';
  let remainingText = '';

  if (segments.length > 2) {
    initialText = segments.slice(0, 2).join(' ');
    remainingText = segments.slice(2).join(' ');
  } else {
    initialText = value;
  }

  if (initialText.length > maxLength) {
    initialText = initialText.slice(0, maxLength);
    remainingText = value.slice(maxLength);
  }

  const isExpandable = remainingText.length > 0;

  if (!isExpandable) {
    return <p {...props}>{value}</p>;
  }

  return (
    <Collapsible {...props} open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="text-left">
        {initialText}
        {!open && <>&hellip;</>}
        <span className={clsx({ hidden: !open })}>{remainingText}</span>
        {!open && <span className="text-primary text-nowrap"> {t('common:actions:showMore')}</span>}
        {open && <span className="text-primary text-nowrap"> {t('common:actions:showLess')}</span>}
      </CollapsibleTrigger>
    </Collapsible>
  );
}
