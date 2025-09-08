# StockSage: AI-Powered Stock Analysis Dashboard

StockSage is an interactive web application built with Next.js that allows users to upload historical stock data from CSV files and receive AI-driven analysis and insights. It provides a rich user interface for visualizing stock performance, comparing multiple stocks, and interacting with an AI chatbot to understand the data better.

## Key Features

*   **User Authentication:** Includes simple, non-functional login and signup pages to demonstrate a complete application flow.
*   **CSV Data Upload:** Users can upload their own stock data in CSV format. The application parses and processes this data for analysis.
*   **Multi-Stock Comparison:** Upload and compare multiple stocks simultaneously. Each stock is assigned a unique color across the charts for easy differentiation.
*   **Interactive Dashboard:** The main dashboard is composed of several key components:
    *   **Metric Cards:** At-a-glance cards displaying AI-generated metrics like market trend, volatility, trading volume, next-day price predictions, and buy/hold/sell recommendations.
    *   **Close Price Chart:** A line chart comparing the closing prices of all selected stocks over a chosen date range, with options to overlay 7, 14, and 30-day moving averages.
    *   **Candlestick Chart:** A detailed candlestick chart for the primary selected stock, showing daily open, high, low, and close prices, along with the AI-predicted price for the next day.
    *   **Volume Chart:** A bar chart visualizing the daily trading volume, with significant spikes automatically highlighted.
*   **AI-Powered Chatbot:** An integrated chatbot that allows users to ask natural language questions about the loaded stock data and receive informative answers based on the AI's analysis.
*   **Customizable Data View:** Users can filter the data by a specific date range and toggle the visibility of various stocks and moving averages on the charts.
*   **Responsive UI:** The application is designed to be fully responsive and accessible on both desktop and mobile devices.

## Technology Stack

This project is built with a modern, type-safe, and component-based technology stack.

*   **Framework:** **Next.js** (v15) with the App Router for server-centric routing and rendering.
*   **Language:** **TypeScript** for static typing and improved developer experience.
*   **UI Library:** **React** (v18) for building the user interface with functional components and hooks.
*   **Styling:**
    *   **Tailwind CSS:** A utility-first CSS framework for rapid and consistent styling.
    *   **ShadCN/UI:** A collection of beautifully designed, reusable UI components that are fully customizable and accessible.
*   **Generative AI:**
    *   **Genkit:** The core framework for building and managing AI flows.
    *   **Google AI (Gemini):** The underlying large language model used for price prediction, stock recommendations, and chatbot responses.
*   **Charting Library:** **Recharts** for creating responsive and interactive charts (line, bar, and candlestick).
*   **Form Management:**
    *   **React Hook Form:** For efficient and flexible form state management.
    *   **Zod:** For schema-based form validation.
*   **File Handling:** **React Dropzone** for providing an easy-to-use drag-and-drop interface for file uploads.
*   **Icons:** **Lucide React** for a comprehensive and consistent set of icons.
