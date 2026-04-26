# HeyCloset 👕🏠

HeyCloset is a sophisticated personal wardrobe warehouse system designed to help you manage your clothing and items across multiple residential locations. It provides a digital twin of your physical storage, making it easy to track, visualize, and maintain your collection.

## ✨ Core Features

-   **🏠 Multi-Home Management**: Track items across different residences (e.g., Main House, Beach House, Office).
-   **📦 Warehouse Explorer**: A hierarchical drill-down view from Home to Closet to specific Partitions.
-   **🏷️ Dimensional Tagging**: Deep search capabilities using styles, colors, and material textures.
-   **🧼 Wash Health Protocol**: Track cleaning history and get alerts for items that haven't been washed in over 30 days.
-   **🔍 Global Inventory**: A real-time searchable inventory of every item in your global collection.

## 🚀 Deployment to Vercel

 HeyCloset is ready for one-click deployment to Vercel as a static Single Page Application (SPA).

### Prerequisites

-   A **Supabase** account with the Storage Edge Functions deployed.
-   Your Supabase **Anon Key**.

### Steps

1.  **Push to GitHub**: Push this repository to your GitHub account.
2.  **Import to Vercel**: Connect your GitHub repository to Vercel.
3.  **Configure Environment Variables**: In the Vercel project settings, add the following environment variable:
    -   `VITE_SUPABASE_API_KEY`: Your Supabase Project's Anon Key.
4.  **Deploy**: Click "Deploy". Vercel will automatically build the React frontend and serve it.

> **Note**: This application makes direct calls to your Supabase Edge Functions. Ensure that CORS is correctly configured in your Supabase project to allow requests from your deployment domain.

## 🛠️ Technology Stack

-   **Frontend**: React 19, TypeScript, Vite.
-   **Styling**: Tailwind CSS, Lucide Icons.
-   **Animations**: Motion (framer-motion).
-   **Database**: Supabase (via Edge Functions).

---
*Created with HeyCloset - Your wardrobe, digitally mastered.*
