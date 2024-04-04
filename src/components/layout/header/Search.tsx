import { Autocomplete, Group, Text, useMantineTheme } from '@mantine/core';
import { useDisclosure, useHotkeys } from '@mantine/hooks';
import {
  IconMovie,
  IconSearch,
  IconWorld,
  TablerIconsProps
} from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { ReactNode, forwardRef, useMemo, useRef, useState } from 'react';
import { useConfigContext } from '~/config/provider';
import { api } from '~/utils/api';

import { AreaType } from '~/types/area';
import { MovieModal } from './Search/MovieModal';

type SearchProps = {
  isMobile?: boolean;
  autoFocus?: boolean;
};

export const Search = ({ isMobile, autoFocus }: SearchProps) => {
  const { t } = useTranslation('layout/header');
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useHotkeys([['mod+K', () => ref.current?.focus()]]);
  const { data: sessionData } = useSession();
  const { data: userWithSettings } = api.user.withSettings.useQuery(undefined, {
    enabled: !!sessionData?.user,
  });
  const { config } = useConfigContext();
  const { colors } = useMantineTheme();
  const router = useRouter();
  const [showMovieModal, movieModal] = useDisclosure(router.query.movie === 'true');

  const apps = useConfigApps(search);
  const engines = generateEngines(
    search,
    userWithSettings?.settings.searchTemplate ?? 'https://www.google.com/search?q=%s'
  )
    .filter(
      (engine) =>
        engine.sort !== 'movie' || config?.apps.some((app) => app.integration.type === engine.value)
    )
    .map((engine) => ({
      ...engine,
      label: t(`search.engines.${engine.sort}`, {
        app: engine.value,
        query: search,
      }),
    }));
  const data = [...apps, ...engines];

  return (
    <>
      <Autocomplete
        ref={ref}
        radius="xl"
        w={isMobile ? '100%' : 400}
        variant="filled"
        placeholder={`${t('search.label')}...`}
        hoverOnSearchChange
        autoFocus={autoFocus}
        rightSection={
          <IconSearch
            onClick={() => ref.current?.focus()}
            color={colors.gray[5]}
            size={16}
            stroke={1.5}
          />
        }
        limit={8}
        value={search}
        onChange={setSearch}
        data={data}
        itemComponent={SearchItemComponent}
        filter={(value, item: SearchAutoCompleteItem) =>
          engines.some((engine) => engine.sort === item.sort) || stringContainsAllParts(item.value, value.split(" "))
        }
        classNames={{
          input: 'dashboard-header-search-input',
          root: 'dashboard-header-search-root',
        }}
        onItemSubmit={(item: SearchAutoCompleteItem) => {
          setSearch('');
          if (item.sort === 'movie') {
            const url = new URL(`${window.location.origin}${router.asPath}`);
            url.searchParams.set('movie', 'true');
            url.searchParams.set('search', search);
            url.searchParams.set('type', item.value);
            router.push(url, undefined, { shallow: true });
            movieModal.open();
            return;
          }
          const target = userWithSettings?.settings.openSearchInNewTab ? '_blank' : '_self';
          window.open(item.metaData.url, target);
        }}
        aria-label={t('search.label') as string}
      />
      <MovieModal
        opened={showMovieModal}
        closeModal={() => {
          movieModal.close();
          const url = new URL(`${window.location.origin}${router.asPath}`);
          url.searchParams.delete('movie');
          url.searchParams.delete('search');
          url.searchParams.delete('type');
          router.push(url, undefined, { shallow: true });
        }}
      />
    </>
  );
};

const SearchItemComponent = forwardRef<HTMLDivElement, SearchAutoCompleteItem & { label: string }>(
  ({ icon, label, value, sort, ...others }, ref) => {
    let Icon = getItemComponent(icon);

    return (
      <Group ref={ref} noWrap {...others}>
        <Icon size={20} />
        <Text>{label}</Text>
      </Group>
    );
  }
);

const getItemComponent = (icon: SearchAutoCompleteItem['icon']) => {
  if (typeof icon !== 'string') {
    return icon;
  }

  return (props: TablerIconsProps) => (
    <img src={icon} height={props.size} width={props.size} style={{ objectFit: 'contain' }} />
  );
};

const useConfigApps = (search: string) => {
  const { config } = useConfigContext();
  return useMemo(() => {
    if (search.trim().length === 0) return [];

    const categories = config?.categories;

    const widgets = config?.widgets.filter((widget) =>
      widget?.type === "bookmark"
    )

    let links: any[] = []
    widgets?.forEach((widget) => {

      links = [...links, ...widget?.properties.items.map((item: any) => {

        return {
          icon: item.iconUrl,
          label: widget?.properties.name + " - " + item.name,
          value: widget?.properties.name + " - " + item.name,
          sort: 'app',
          metaData: {
            url: item.href,
          },
        }
      })]
    }
    )

const apps: any = config?.apps.map((app) => {
  let category: any = "";
  const area: AreaType = app.area;
  //TO DO 
  if (area is Cate) {
    category = categories?.find(category => category.id === app.area.properties.id ?? null)
    if (category !== undefined) {
      category = category?.name + " - "
    }
  }
  return {
    icon: app.appearance.iconUrl,
    label: category + app.name,
    value: category + app.name,
    sort: 'app',
    metaData: {
      url: app.behaviour.externalUrl,
    },
  }
})


    return (
      [...links, ...apps]
    );
  }, [search, config]);
};

type SearchAutoCompleteItem = {
  icon: ((props: TablerIconsProps) => ReactNode) | string;
  value: string;
} & (
    | {
      sort: 'web' | 'torrent' | 'youtube' | 'app';
      metaData: {
        url: string;
      };
    }
    | {
      sort: 'movie';
    }
  );
const movieApps = ['overseerr', 'jellyseerr'] as const;
const generateEngines = (searchValue: string, webTemplate: string) =>
  searchValue.trim().length > 0
    ? ([
      {
        icon: IconWorld,
        value: `web`,
        sort: 'web',
        metaData: {
          url: webTemplate.includes('%s')
            ? webTemplate.replace('%s', searchValue)
            : webTemplate + searchValue,
        },
      },
      ...movieApps.map(
        (name) =>
          ({
            icon: IconMovie,
            value: name,
            sort: 'movie',
          }) as const
      ),
    ] as const satisfies Readonly<SearchAutoCompleteItem[]>)
    : [];


    function stringContainsAllParts(string: string, searchParts: string[]) {
      // Escape special characters in search parts
      const escapedSearchParts = searchParts.map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      
      // Construct regex pattern
      const pattern = new RegExp(escapedSearchParts.join('.*'), 'i'); // 'i' for case insensitive search
      
      // Test if the string matches the pattern
      return pattern.test(string);
    }