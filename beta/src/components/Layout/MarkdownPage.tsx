/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

import * as React from 'react';
import {MDXProvider} from '@mdx-js/react';
import {DocsPageFooter} from 'components/DocsFooter';
import {MDXComponents} from 'components/MDX/MDXComponents';
import {Seo} from 'components/Seo';
import PageHeading from 'components/PageHeading';
import {useRouteMeta} from './useRouteMeta';
import {Toc} from './Toc';
import {useRouter} from 'next/router';
import {useEffect} from 'react';
import {useState} from 'react';
import {Heart} from 'components/Heart';
export interface MarkdownProps<Frontmatter> {
  meta: Frontmatter & {description?: string};
  children?: React.ReactNode;
}

function MaxWidth({children}: {children: any}) {
  return <div className="max-w-4xl ml-0 2xl:mx-auto">{children}</div>;
}

export function MarkdownPage<
  T extends {title: string; status?: string} = {title: string; status?: string}
>({children, meta}: MarkdownProps<T>) {
  const {route, nextRoute, prevRoute} = useRouteMeta();
  const title = meta.title || route?.title || '';
  const description = meta.description || route?.description || '';
  const router = useRouter();
  const [isFavourite, setIsFavourite] = useState(false);
  const paths = router.pathname.split('/');
  const currentPath = paths[paths.length - 1];
  const setFavourite = () => {
    setIsFavourite(isFavourite ? false : true);
    const favourites = JSON.parse(localStorage.getItem('favourites') || '');

    localStorage.setItem(
      'favourites',
      JSON.stringify([
        ...(favourites?.includes(currentPath)
          ? favourites.filter((page: string) => page !== currentPath)
          : [
              ...(favourites?.length
                ? [...favourites, currentPath]
                : [currentPath]),
            ]),
      ])
    );
  };
  useEffect(() => {
    const favourites = JSON.parse(localStorage.getItem('favourites') || '');
    setIsFavourite(favourites?.includes(currentPath));

    const visitedPages = localStorage.getItem('visitedPages');
    localStorage.setItem(
      'visitedPages',
      JSON.stringify([
        ...(visitedPages !== null ? JSON.parse(visitedPages) : []),
        ...(!visitedPages?.includes(currentPath) ? [currentPath] : []),
      ])
    );
  }, []);

  let anchors: Array<{
    url: string;
    text: React.ReactNode;
    depth: number;
  }> = React.Children.toArray(children)
    .filter((child: any) => {
      if (child.props?.mdxType) {
        return ['h1', 'h2', 'h3', 'Challenges', 'Recipes', 'Recap'].includes(
          child.props.mdxType
        );
      }
      return false;
    })
    .map((child: any) => {
      if (child.props.mdxType === 'Challenges') {
        return {
          url: '#challenges',
          depth: 0,
          text: 'Challenges',
        };
      }
      if (child.props.mdxType === 'Recipes') {
        return {
          url: '#recipes',
          depth: 0,
          text: 'Recipes',
        };
      }
      if (child.props.mdxType === 'Recap') {
        return {
          url: '#recap',
          depth: 0,
          text: 'Recap',
        };
      }
      return {
        url: '#' + child.props.id,
        depth:
          (child.props?.mdxType &&
            parseInt(child.props.mdxType.replace('h', ''), 0)) ??
          0,
        text: child.props.children,
      };
    });
  if (anchors.length > 0) {
    anchors.unshift({
      depth: 1,
      text: 'Overview',
      url: '#',
    });
  }

  if (!route) {
    console.error('This page was not added to one of the sidebar JSON files.');
  }
  const isHomePage = route?.path === '/';

  // Auto-wrap everything except a few types into
  // <MaxWidth> wrappers. Keep reusing the same
  // wrapper as long as we can until we meet
  // a full-width section which interrupts it.
  let fullWidthTypes = [
    'Sandpack',
    'APIAnatomy',
    'FullWidth',
    'Illustration',
    'IllustrationBlock',
    'Challenges',
    'Recipes',
  ];
  let wrapQueue: React.ReactNode[] = [];
  let finalChildren: React.ReactNode[] = [];
  function flushWrapper(key: string | number) {
    if (wrapQueue.length > 0) {
      finalChildren.push(<MaxWidth key={key}>{wrapQueue}</MaxWidth>);
      wrapQueue = [];
    }
  }
  function handleChild(child: any, key: string | number) {
    if (child == null) {
      return;
    }
    if (typeof child !== 'object') {
      wrapQueue.push(child);
      return;
    }
    if (fullWidthTypes.includes(child.props.mdxType)) {
      flushWrapper(key);
      finalChildren.push(child);
    } else {
      wrapQueue.push(child);
    }
  }
  React.Children.forEach(children, handleChild);
  flushWrapper('last');

  return (
    <article className="h-full mx-auto relative w-full min-w-0">
      <div className="lg:pt-0 pt-20 pl-0 lg:pl-80 2xl:px-80 ">
        <Seo title={title} />
        {!isHomePage && (
          <PageHeading
            title={title}
            description={description}
            tags={route?.tags}>
            <div className="m-2 pt-1" onClick={() => setFavourite()}>
              <Heart fill={isFavourite} />
            </div>
          </PageHeading>
        )}
        <div className="px-5 sm:px-12">
          <div className="max-w-7xl mx-auto">
            <MDXProvider components={MDXComponents}>
              {finalChildren}
            </MDXProvider>
          </div>
          <DocsPageFooter
            route={route}
            nextRoute={nextRoute}
            prevRoute={prevRoute}
          />
        </div>
      </div>
      <div className="w-full lg:max-w-xs hidden 2xl:block">
        {!isHomePage && anchors.length > 0 && <Toc headings={anchors} />}
      </div>
    </article>
  );
}
