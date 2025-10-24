# AI Study Buddy - UI/UX Style Guide

## 1. Core Principles

This style guide ensures a cohesive, modern, and user-friendly experience across the "AI Study Buddy" application. The design is built on three core principles:

-   **Simplicity & Clarity:** A clean, minimalist interface serves as a foundation, avoiding clutter and focusing the user on the task at hand through intuitive navigation and clear visual hierarchy.
-   **Engaging & Colorful:** To appeal to a student audience, the UI is infused with a vibrant, multi-color palette. Each feature has a distinct accent color, making the application more lively, visually appealing, and memorable.
-   **Flexible & Accessible:** With support for both light and dark themes, users can choose the mode that best suits their environment and preference. The design ensures a seamless and accessible experience on any device.

## 2. Theming

The application supports two visual themes: **Light Mode** and **Dark Mode**. A toggle in the header allows users to switch between them. All components must be styled to adapt to both themes using Tailwind CSS's `dark:` variant.

-   **Light Mode:** The default theme, featuring a bright, clean aesthetic with dark text on light backgrounds. Ideal for well-lit environments.
-   **Dark Mode:** A sleek theme with light text on dark backgrounds, reducing eye strain in low-light conditions.

## 3. Color Palette

The color scheme is designed to work effectively in both themes, using a consistent set of vibrant accent colors that pop against both light and dark backgrounds.

### Base Palette

| Role               | Light Mode                                | Dark Mode                                  |
| ------------------ | ----------------------------------------- | ------------------------------------------ |
| **Primary Text**   | Dark Gray (`text-gray-800`)               | White (`dark:text-white`)                  |
| **Secondary Text** | Medium Gray (`text-gray-600`)             | Light Gray (`dark:text-gray-300`)          |
| **Background**     | Animated Light Gradient                   | Animated Dark Gradient                     |
| **UI Surface**     | White / Light Gray (`bg-white`, `bg-gray-100`) | Dark Gray (`dark:bg-gray-900`, `dark:bg-gray-800`) |
| **Inputs**         | Light Gray (`bg-gray-100`)                | Medium-Dark Gray (`dark:bg-gray-700`)      |
| **Borders**        | Light Gray (`border-gray-200`)            | Dark Gray (`dark:border-gray-700`)         |
| **Success**        | Green (`text-green-600`)                  | Light Green (`dark:text-green-400`)        |
| **Error**          | Red (`text-red-600`)                      | Light Red (`dark:text-red-400`)            |

### Feature Accent Colors

Each feature's accent color is chosen to have good contrast in both light and dark modes.

| Feature                    | Color    | Light Mode Class (Example)         | Dark Mode Class (Example)         |
| -------------------------- | -------- | ---------------------------------- | --------------------------------- |
| **PDF Reading Assistant**  | Cyan     | `bg-cyan-500`, `text-cyan-500`     | `dark:bg-cyan-500`, `dark:text-cyan-400` |
| **Routine Maker**          | Rose     | `bg-rose-500`, `text-rose-500`     | `dark:bg-rose-500`, `dark:text-rose-400` |
| **Language Game**          | Orange   | `bg-orange-500`, `text-orange-500` | `dark:bg-orange-500`, `dark:text-orange-400` |
| **Event Discovery**        | Indigo   | `bg-indigo-500`, `text-indigo-500` | `dark:bg-indigo-500`, `dark:text-indigo-400` |
| **AI Drawing Artist**      | Emerald  | `bg-emerald-500`, `text-emerald-500` | `dark:bg-emerald-500`, `dark:text-emerald-400` |

## 4. Typography

The `Poppins` font family is used for its clean, modern, and friendly appearance, ensuring excellent legibility.

| Element         | Font Size      | Font Weight     | Tailwind CSS                       |
| --------------- | -------------- | --------------- | ---------------------------------- |
| **Hero Title**  | `text-5xl`     | Extra-Bold      | `text-5xl font-extrabold`          |
| **Page Title**  | `text-4xl`     | Bold            | `text-4xl font-bold`               |
| **Card Title**  | `text-xl`      | Bold            | `text-xl font-bold`                |
| **Body Text**   | `text-base/lg` | Normal          | `text-base`, `text-lg`             |
| **Buttons**     | `text-base/lg` | Bold/Semi-Bold  | `font-bold`, `font-semibold`       |
| **Labels/Meta** | `text-sm`      | Normal/Semi-Bold| `text-sm`, `font-semibold`         |

## 5. Components

Component styles are standardized for a predictable and intuitive user experience across both themes.

### Buttons

-   **Primary:** Solid background using the feature's accent color.
    -   Classes: `bg-<color>-500 hover:bg-<color>-600`
-   **Secondary:** Light gray in light mode, dark gray in dark mode.
    -   Classes: `bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600`
-   **States:** Disabled buttons have reduced opacity and a `not-allowed` cursor.
    -   Classes: `disabled:opacity-50 disabled:cursor-not-allowed`

### Cards

-   Soft, rounded corners (`rounded-2xl`).
-   Subtle border that adapts to the theme (`border-gray-200 dark:border-white/10`).
-   Interactive cards have a highlight effect on hover using their feature's accent color.

### Forms & Inputs

-   Theme-adaptive backgrounds (`bg-gray-100 dark:bg-gray-700`).
-   Clear focus state indicated by a ring in the feature's accent color (`focus:ring-2 focus:ring-<color>-500`).

## 6. Layout & Spacing

A consistent spacing and layout system creates a balanced and organized visual structure.

-   **Grid:** A responsive grid is used for main layouts (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
-   **Spacing:** Tailwind's spacing scale (`gap-6`, `p-8`) is used for consistent margins and padding.
-   **Whitespace:** Generous whitespace is used to separate elements and improve focus.
-   **Responsiveness:** All components and layouts are designed to be fully responsive, from mobile to desktop.

## 7. Animation & Interaction

Animations are subtle and serve to enhance the user experience by providing feedback and guiding attention.

-   **Page Load:** Gentle fade-in and slide-up/down animations (`animate-fade-in-up`).
-   **Text Gradient:** The main title uses a shimmering, animated gradient of all feature colors.
-   **Hover Effects:** Smooth transitions on all interactive elements (`transition-all duration-300`).
-   **Visual Feedback:** Interactive elements provide immediate visual confirmation.