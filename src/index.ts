/**
 * @ki4jlu/design-system — public API.
 *
 * Import components from here; import the tokens once in your app CSS:
 *   @import "tailwindcss";
 *   @import "@ki4jlu/design-system/tokens.css";
 *   @source "../node_modules/@ki4jlu/design-system";
 * (see README for full consumer setup, fonts, and the no-flash theme script)
 */
export { Avatar, type AvatarProps } from "./components/avatar";
export { Badge, type BadgeProps } from "./components/badge";
export { badgeVariants } from "./components/badge-variants";
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
export {
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./components/form";
export { Input, type InputProps } from "./components/input";
export { Label } from "./components/label";
export { MenuItem, type MenuItemProps } from "./components/menu-item";
export { menuItemVariants } from "./components/menu-item-variants";
export { NavItem, type NavItemProps } from "./components/nav-item";
export { navItemVariants } from "./components/nav-item-variants";
export {
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
} from "./components/popover";
export {
  SegmentedControl,
  type SegmentedControlOption,
  type SegmentedControlProps,
} from "./components/segmented-control";
export { Spinner, type SpinnerProps } from "./components/spinner";
export { Switch } from "./components/switch";
export { Textarea, type TextareaProps } from "./components/textarea";
export { ThemeToggle } from "./components/theme-toggle";
export {
  ThemeProvider,
  useTheme,
  type Theme,
  type ResolvedTheme,
} from "./theme/ThemeContext";
export { cn } from "./lib/utils";
