/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import React from 'react';
// @ts-ignore
import {flushSync} from 'react-dom';
import {
  useSandpack,
  useActiveCode,
  SandpackCodeEditor,
  SandpackThemeProvider,
  SandpackReactDevTools,
} from '@codesandbox/sandpack-react';
import scrollIntoView from 'scroll-into-view-if-needed';
import {useTimer} from 'use-timer';

import cn from 'classnames';

import {IconChevron} from 'components/Icon/IconChevron';
import {NavigationBar} from './NavigationBar';
import {Preview} from './Preview';
import {CustomTheme} from './Themes';
import {ReturnValue} from 'use-timer/lib/types';

/**
 * Temp component: testing purposes only
 */
const Timer: React.FC<{timer: ReturnValue}> = ({timer}) => {
  const {listen} = useSandpack();

  React.useEffect(() => {
    const unsub = listen((message) => {
      if (message.type === 'start') {
        timer.start();
      } else if (message.type === 'done') {
        timer.pause();
      }
    });

    return () => unsub();
  }, []);

  return <>{timer.time}ms</>;
};

export function CustomPreset({
  isSingleFile,
  showDevTools,
  onDevToolsLoad,
  devToolsLoaded,
}: {
  isSingleFile: boolean;
  showDevTools: boolean;
  devToolsLoaded: boolean;
  onDevToolsLoad: () => void;
}) {
  const timer = useTimer({interval: 1});
  const lineCountRef = React.useRef<{[key: string]: number}>({});
  const containerRef = React.useRef<HTMLDivElement>(null);
  const {sandpack} = useSandpack();
  const {code} = useActiveCode();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const {activePath} = sandpack;
  if (!lineCountRef.current[activePath]) {
    lineCountRef.current[activePath] = code.split('\n').length;
  }
  const lineCount = lineCountRef.current[activePath];
  const isExpandable = lineCount > 16 || isExpanded;

  return (
    <>
      Time to load: <Timer timer={timer} />
      <div
        className="shadow-lg dark:shadow-lg-dark rounded-lg"
        ref={containerRef}>
        <NavigationBar showDownload={isSingleFile} onReset={timer.reset} />
        <SandpackThemeProvider theme={CustomTheme}>
          <div
            ref={sandpack.lazyAnchorRef}
            className={cn(
              'sp-layout sp-custom-layout',
              showDevTools && devToolsLoaded && 'sp-layout-devtools',
              isExpanded && 'sp-layout-expanded'
            )}>
            <SandpackCodeEditor
              showLineNumbers
              showInlineErrors
              showTabs={false}
              showRunButton={false}
            />
            <Preview
              className="order-last xl:order-2"
              isExpanded={isExpanded}
            />
            {isExpandable && (
              <button
                translate="yes"
                className="flex text-base justify-between dark:border-card-dark bg-wash dark:bg-card-dark items-center z-10 rounded-t-none p-1 w-full order-2 xl:order-last border-b-1 relative top-0"
                onClick={() => {
                  const nextIsExpanded = !isExpanded;
                  flushSync(() => {
                    setIsExpanded(nextIsExpanded);
                  });
                  if (!nextIsExpanded && containerRef.current !== null) {
                    scrollIntoView(containerRef.current, {
                      scrollMode: 'if-needed',
                      block: 'nearest',
                      inline: 'nearest',
                    });
                  }
                }}>
                <span className="flex p-2 focus:outline-none text-primary dark:text-primary-dark">
                  <IconChevron
                    className="inline mr-1.5 text-xl"
                    displayDirection={isExpanded ? 'up' : 'down'}
                  />
                  {isExpanded ? 'Show less' : 'Show more'}
                </span>
              </button>
            )}
          </div>

          {showDevTools && (
            <SandpackReactDevTools onLoadModule={onDevToolsLoad} />
          )}
        </SandpackThemeProvider>
      </div>
    </>
  );
}
