# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5ea5edb3-a39e-4804-9a0d-edc84de20286

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5ea5edb3-a39e-4804-9a0d-edc84de20286) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database, Auth, Storage)

## Admin Dashboard

This project includes an internal admin dashboard at `/admin` for managing application data.

### Access Requirements

- Admin access is restricted to users with the `admin` role in the database
- Admin role must be manually granted via the `user_roles` table
- After signing up, users must be granted admin access before they can use the dashboard

### Granting Admin Access

To grant admin access to a user, run this SQL query in your Supabase SQL Editor:

```sql
-- Replace 'user-uuid' with the actual user ID from auth.users
INSERT INTO public.user_roles (user_id, role) 
VALUES ('user-uuid', 'admin');
```

### Admin Features

The admin dashboard includes management pages for:

- **Overview**: System metrics and statistics
- **Users & Usage**: User management and analytics
- **Training Content**: Skills, modules, and troubleshooting guides
- **Media Library**: Training videos and images
- **Dog Knowledge Base**: Breeds, vaccines, and treatments
- **Invite Codes**: Access control management
- **System & Logs**: Health monitoring and activity logs

### Security

- Admin authentication uses Supabase's `has_role()` security definer function
- All admin authorization is enforced at the database level via RLS policies
- Admin routes are lazy-loaded to optimize bundle size for regular users
- Non-admin users are immediately redirected if they attempt to access `/admin`

### Development Notes

- Admin pages are located in `src/admin/pages/`
- Shared admin layout is in `src/admin/layout/AdminLayout.tsx`
- Admin routes use React lazy loading for code splitting
- All admin components follow the same design system as the main app

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5ea5edb3-a39e-4804-9a0d-edc84de20286) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
