/**
 * Generic component types for reusable components
 */
import { ReactNode, ComponentType, HTMLAttributes, FormEvent } from 'react';

/**
 * Generic props for a component that can be loaded
 */
export interface LoadableProps<T = unknown> {
  /**
   * Whether the component is in a loading state
   */
  isLoading?: boolean;
  
  /**
   * Data to be displayed when loaded
   */
  data?: T;
  
  /**
   * Error to be displayed if loading failed
   */
  error?: Error;
  
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
  
  /**
   * Custom error component
   */
  errorComponent?: ReactNode;
}

/**
 * Generic props for a component that can be selected
 */
export interface SelectableProps<T = unknown> {
  /**
   * Whether the component is selected
   */
  isSelected?: boolean;
  
  /**
   * Value of the component
   */
  value: T;
  
  /**
   * Handler for when the component is selected
   */
  onSelect?: (value: T) => void;
}

/**
 * Generic props for a component that can be disabled
 */
export interface DisableableProps {
  /**
   * Whether the component is disabled
   */
  isDisabled?: boolean;
}

/**
 * Generic props for a component that can be expanded
 */
export interface ExpandableProps {
  /**
   * Whether the component is expanded
   */
  isExpanded?: boolean;
  
  /**
   * Handler for when the component is toggled
   */
  onToggle?: () => void;
}

/**
 * Generic props for a component with pagination
 */
export interface PaginationProps {
  /**
   * Current page number
   */
  currentPage: number;
  
  /**
   * Total number of pages
   */
  totalPages: number;
  
  /**
   * Number of items per page
   */
  pageSize: number;
  
  /**
   * Handler for when the page is changed
   */
  onPageChange: (page: number) => void;
}

/**
 * Generic props for a component with sorting
 */
export interface SortableProps<T extends string = string> {
  /**
   * Current sort field
   */
  sortField: T;
  
  /**
   * Current sort direction
   */
  sortDirection: 'asc' | 'desc';
  
  /**
   * Handler for when the sort is changed
   */
  onSortChange: (field: T, direction: 'asc' | 'desc') => void;
}

/**
 * Generic props for a component with filtering
 */
export interface FilterableProps<T = unknown> {
  /**
   * Current filters
   */
  filters: T;
  
  /**
   * Handler for when the filters are changed
   */
  onFilterChange: (filters: T) => void;
}

/**
 * Generic props for a form component
 */
export interface FormProps<T = Record<string, unknown>> {
  /**
   * Initial values for the form
   */
  initialValues: T;
  
  /**
   * Handler for when the form is submitted
   */
  onSubmit: (values: T, event: FormEvent<HTMLFormElement>) => void;
  
  /**
   * Handler for when the form is reset
   */
  onReset?: (event: FormEvent<HTMLFormElement>) => void;
  
  /**
   * Whether the form is in a submitting state
   */
  isSubmitting?: boolean;
  
  /**
   * Whether the form has been submitted
   */
  isSubmitted?: boolean;
  
  /**
   * Validation errors for the form
   */
  errors?: Record<keyof T, string>;
}

/**
 * Generic props for a modal component
 */
export interface ModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Handler for when the modal is closed
   */
  onClose: () => void;
  
  /**
   * Title of the modal
   */
  title?: string;
  
  /**
   * Content of the modal
   */
  children: ReactNode;
  
  /**
   * Size of the modal
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Generic props for a tooltip component
 */
export interface TooltipProps {
  /**
   * Content of the tooltip
   */
  content: ReactNode;
  
  /**
   * Position of the tooltip
   */
  position?: 'top' | 'right' | 'bottom' | 'left';
  
  /**
   * Delay before showing the tooltip in milliseconds
   */
  delay?: number;
  
  /**
   * Children to wrap with the tooltip
   */
  children: ReactNode;
}

/**
 * Generic props for a component with a theme
 */
export interface ThemedProps {
  /**
   * Theme variant
   */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  
  /**
   * Custom theme class
   */
  themeClass?: string;
}

/**
 * Generic props for a component with an icon
 */
export interface IconProps {
  /**
   * Icon to display
   */
  icon: ComponentType | string;
  
  /**
   * Size of the icon
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Color of the icon
   */
  color?: string;
}

/**
 * Generic props for a component with a label
 */
export interface LabeledProps {
  /**
   * Label text
   */
  label: string;
  
  /**
   * Whether to hide the label
   */
  hideLabel?: boolean;
  
  /**
   * ID for the labeled element
   */
  id?: string;
}

/**
 * Generic props for a component with a description
 */
export interface DescribedProps {
  /**
   * Description text
   */
  description?: string;
  
  /**
   * ID for the description element
   */
  descriptionId?: string;
}

/**
 * Generic props for a component with validation
 */
export interface ValidatedProps {
  /**
   * Whether the component is valid
   */
  isValid?: boolean;
  
  /**
   * Whether the component is invalid
   */
  isInvalid?: boolean;
  
  /**
   * Validation error message
   */
  errorMessage?: string;
  
  /**
   * Validation success message
   */
  successMessage?: string;
}

/**
 * Generic props for a component with animations
 */
export interface AnimatedProps {
  /**
   * Whether to animate the component
   */
  animate?: boolean;
  
  /**
   * Animation type
   */
  animationType?: 'fade' | 'slide' | 'scale' | 'bounce' | 'custom';
  
  /**
   * Animation duration in milliseconds
   */
  animationDuration?: number;
  
  /**
   * Animation delay in milliseconds
   */
  animationDelay?: number;
}

/**
 * Generic component props with common HTML attributes
 */
export type GenericComponentProps<P = {}, E extends HTMLElement = HTMLDivElement> = P & 
  HTMLAttributes<E> & {
    /**
     * Additional CSS class names
     */
    className?: string;
    
    /**
     * Additional inline styles
     */
    style?: React.CSSProperties;
    
    /**
     * Reference to the component
     */
    ref?: React.Ref<E>;
    
    /**
     * Children of the component
     */
    children?: ReactNode;
  };

/**
 * Generic list item props
 */
export interface ListItemProps<T = unknown> {
  /**
   * Item data
   */
  item: T;
  
  /**
   * Index of the item in the list
   */
  index: number;
  
  /**
   * Whether the item is selected
   */
  isSelected?: boolean;
  
  /**
   * Handler for when the item is selected
   */
  onSelect?: (item: T, index: number) => void;
}

/**
 * Generic list props
 */
export interface ListProps<T = unknown> {
  /**
   * List items
   */
  items: T[];
  
  /**
   * Render function for each item
   */
  renderItem: (props: ListItemProps<T>) => ReactNode;
  
  /**
   * Key extractor function
   */
  keyExtractor: (item: T, index: number) => string;
  
  /**
   * Selected item indices
   */
  selectedIndices?: number[];
  
  /**
   * Handler for when an item is selected
   */
  onItemSelect?: (item: T, index: number) => void;
  
  /**
   * Whether the list is loading
   */
  isLoading?: boolean;
  
  /**
   * Loading component
   */
  loadingComponent?: ReactNode;
  
  /**
   * Empty state component
   */
  emptyComponent?: ReactNode;
}
