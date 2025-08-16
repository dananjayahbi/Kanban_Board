# Kanban Board Manager

A modern, production-ready Kanban board management application built with Next.js, TypeScript, and MongoDB.

## Features

- **Multiple Kanban Boards**: Create unlimited boards for different projects
- **Drag & Drop**: Full drag-and-drop functionality using @dnd-kit
- **Task Management**: Create, edit, delete tasks with priorities, due dates, and estimated hours
- **Dashboard**: Comprehensive statistics and analytics
- **Alerts**: Automatic deadline notifications for upcoming tasks
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Light Theme**: Clean, modern interface with light theme
- **Production Ready**: Docker support, error handling, and performance optimizations

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Shadcn/ui components
- **Database**: MongoDB with Prisma ORM
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts for data visualization
- **Deployment**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kanban-board-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your MongoDB connection string:
   ```
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/kanban-app?retryWrites=true&w=majority"
   NODE_ENV=development
   ```

4. **Generate Prisma client**
   ```bash
   npm run db:generate
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see the application.

## Production Deployment

### Using Docker (Recommended)

1. **Build the Docker image**
   ```bash
   npm run docker:build
   ```

2. **Set up production environment variables**
   ```bash
   cp .env.production .env
   ```
   Update with your production MongoDB connection string and other settings.

3. **Start with Docker Compose**
   ```bash
   npm run docker:up
   ```

### Manual Deployment

1. **Build for production**
   ```bash
   npm run production:build
   ```

2. **Start production server**
   ```bash
   npm run production:start
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MongoDB connection string | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application name | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |
| `PORT` | Server port (default: 3000) | No |
| `HOSTNAME` | Server hostname (default: 0.0.0.0) | No |

## Database Setup

### MongoDB Atlas (Cloud)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string
5. Update `DATABASE_URL` in your `.env` file

### Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="mongodb://localhost:27017/kanban-app"
   ```

## API Endpoints

### Boards
- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create a new board

### Tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks` - Update a task
- `DELETE /api/tasks?id={taskId}` - Delete a task

### Alerts
- `GET /api/alerts` - Get upcoming deadline alerts

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push database schema
- `npm run db:studio` - Open Prisma Studio
- `npm run docker:build` - Build Docker image
- `npm run docker:up` - Start with Docker Compose
- `npm run docker:down` - Stop Docker containers

## Error Handling

The application includes comprehensive error handling:

- **Database Connection Errors**: Clear error messages with setup instructions
- **API Errors**: Proper HTTP status codes and error messages
- **Client-side Errors**: Error boundaries and user-friendly error messages
- **Loading States**: Loading indicators for async operations

## Security

- Input validation on all API endpoints
- Security headers (XSS protection, frame options, content type options)
- Environment variable protection
- CORS configuration for production
- Graceful shutdown handling

## Performance Optimizations

- React Strict Mode enabled
- Code splitting and lazy loading
- Image optimization
- Compression enabled
- Efficient database queries
- Error boundaries for stability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.