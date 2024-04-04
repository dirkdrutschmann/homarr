export type AreaType = WrapperAreaType | CategoryAreaType | SidebarAreaType;

interface WrapperAreaType {
  type: 'wrapper';
  properties: {
    id: string;
  };
}

export interface CategoryAreaType {
  type: 'category';
  properties: {
    id: string;
  };
}

interface SidebarAreaType {
  type: 'sidebar';
  properties: {
    location: 'right' | 'left';
  };
}
