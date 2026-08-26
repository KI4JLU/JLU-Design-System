/**
 * @ki4jlu/design-system — public API.
 *
 * Import components from here; import the tokens once in your app CSS:
 *   @import "tailwindcss";
 *   @import "@ki4jlu/design-system/tokens.css";
 *   @source "../node_modules/@ki4jlu/design-system";
 * (see README for full consumer setup, fonts, and the no-flash theme script)
 */
export { AppShell, type AppShellProps } from "./components/app-shell";
export { Avatar, type AvatarProps } from "./components/avatar";
export { Badge, type BadgeProps } from "./components/badge";
export { badgeVariants } from "./components/badge-variants";
export {
  BottomTabBar,
  type BottomTabBarItem,
  type BottomTabBarProps,
} from "./components/bottom-tab-bar";
export {
  bottomTabBarVariants,
  bottomTabBarTabVariants,
  bottomTabBarIconVariants,
} from "./components/bottom-tab-bar-variants";
export { Button, type ButtonProps } from "./components/button";
export { buttonVariants } from "./components/button-variants";
export {
  Card,
  type CardProps,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/card";
export { ChatBubble, type ChatBubbleProps } from "./components/chat-bubble";
export { chatBubbleVariants } from "./components/chat-bubble-variants";
export { Checkbox } from "./components/checkbox";
export { CodeBlock, type CodeBlockProps } from "./components/code-block";
export { Container, type ContainerProps } from "./components/container";
export { containerVariants } from "./components/container-variants";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/dialog";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  type DropdownMenuItemProps,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./components/dropdown-menu";
export { fieldVariants } from "./components/field-variants";
export { FilterMenu, type FilterMenuProps, type FilterMenuOption } from "./components/filter-menu";
export { Grid, type GridProps } from "./components/grid";
export { gridVariants } from "./components/grid-variants";
export {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./components/form";
export { Input, type InputProps } from "./components/input";
export { Label } from "./components/label";
export { ListToolbar, type ListToolbarProps } from "./components/list-toolbar";
export { Logo, type LogoProps } from "./components/logo";
export { logoVariants } from "./components/logo-variants";
export { MenuItem, type MenuItemProps } from "./components/menu-item";
export { menuItemVariants } from "./components/menu-item-variants";
export { NavItem, type NavItemProps } from "./components/nav-item";
export { navItemVariants } from "./components/nav-item-variants";
export { PageHeader, type PageHeaderProps } from "./components/page-header";
export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
} from "./components/popover";
export { ResizeHandle, type ResizeHandleProps } from "./components/resize-handle";
export { resizeHandleVariants } from "./components/resize-handle-variants";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "./components/select";
export {
  SegmentedControl,
  type SegmentedControlOption,
  type SegmentedControlProps,
} from "./components/segmented-control";
export { Sidebar, type SidebarProps } from "./components/sidebar";
export {
  SidebarUserMenu,
  type SidebarUserMenuProps,
} from "./components/sidebar-user-menu";
export { SidePanel, type SidePanelProps } from "./components/side-panel";
export {
  SIDE_PANEL_RAIL_WIDTH,
  sidePanelVariants,
} from "./components/side-panel-variants";
export { Spinner, type SpinnerProps } from "./components/spinner";
export { Stack, type StackProps } from "./components/stack";
export { stackVariants } from "./components/stack-variants";
export { Switch } from "./components/switch";
export { Textarea, type TextareaProps } from "./components/textarea";
export { ThemeToggle } from "./components/theme-toggle";
export {
  ThemeProvider,
  useTheme,
  type Theme,
  type ResolvedTheme,
} from "./theme/ThemeContext";
export {
  AppShellLayout,
  type AppShellLayoutProps,
} from "./templates/app-shell-layout";
export { AuthLayout, type AuthLayoutProps } from "./templates/auth-layout";
export { ChatLayout, type ChatLayoutProps } from "./templates/chat-layout";
export {
  DashboardLayout,
  type DashboardLayoutProps,
} from "./templates/dashboard-layout";
export { FormLayout, type FormLayoutProps } from "./templates/form-layout";
export { TableLayout, type TableLayoutProps } from "./templates/table-layout";
export {
  WorkspaceLayout,
  type WorkspaceLayoutProps,
  type WorkspacePane,
  type WorkspacePaneId,
  type WorkspaceMobileTab,
} from "./templates/workspace-layout";
export { cn } from "./lib/utils";
