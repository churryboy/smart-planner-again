# Smart Planner - 스마트 플래너

A full-stack Korean calendar and planning application with AI-powered schedule creation, user authentication, and cloud data storage.

## Features

- 🔐 **User Authentication**: Secure signup/login with JWT tokens
- 📅 **Interactive Calendar**: Month view with date selection and timeline view
- 🤖 **AI Schedule Creation**: ChatGPT-powered natural language schedule input
- ✅ **Todo Management**: Interactive todo cards with priority levels and persistence
- 📱 **Mobile Optimized**: Responsive design following Korean design system
- 🎨 **Design System**: Comprehensive Korean typography and color system
- ☁️ **Cloud Storage**: PostgreSQL database for data persistence
- 🔄 **Real-time Sync**: Multi-device access with cloud synchronization

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Security**: Helmet.js, CORS, input validation
- **AI Integration**: OpenAI GPT-3.5-turbo API

### Frontend
- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Fonts**: Pretendard (Korean-optimized)
- **Design**: Korean Design System compliant
- **API**: RESTful API integration with fetch

### Deployment
- **Platform**: Render (Web Service + PostgreSQL)
- **Environment**: Production-ready with environment variables

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/churryboy/smart-planner-again.git
   cd smart-planner-again
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Install PostgreSQL (macOS with Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Create database
   createdb smart_planner
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values:
   # - DATABASE_URL: Your PostgreSQL connection string
   # - JWT_SECRET: A secure random string
   # - OPENAI_API_KEY: Your OpenAI API key
   ```

5. **Configure client-side settings (Optional)**
   ```bash
   # The app works out of the box with localStorage mode
   # To enable AI chat features, edit public/config.js and add your OpenAI API key
   # Or copy from template: cp public/config.example.js public/config.js
   ```

6. **Start the development server**
   ```bash
   npm run dev  # Uses nodemon for auto-restart
   # or
   npm start    # Standard start
   ```

7. **Access the application**
   - Open http://localhost:3000
   - Create an account or login
   - Start planning your schedule!

### Production Deployment on Render

1. **Connect your GitHub repository to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `churryboy/smart-planner-again`

2. **Configure the web service**
   - **Name**: `smart-planner`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Set up PostgreSQL database**
   - Go to Render Dashboard → "New +" → "PostgreSQL"
   - **Name**: `smart-planner-db`
   - **Database Name**: `smart_planner`
   - **User**: `smart_planner_user`

4. **Configure environment variables**
   - In your web service settings, go to "Environment"
   - Add the following variables:
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: Generate a secure random string
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `DATABASE_URL`: Will be automatically set from the database

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Access your live app at the provided URL

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Events
- `GET /api/events` - Get user's events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Todos
- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

## Database Schema

### Users
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `name` (String)
- `timezone` (String, Default: 'Asia/Seoul')
- `created_at`, `updated_at` (Timestamps)

### Events
- `id` (UUID, Primary Key)
- `title` (String, Required)
- `description` (Text, Optional)
- `start_date` (Date, Required)
- `end_date` (Date, Required)
- `start_time` (Time, Optional)
- `end_time` (Time, Optional)
- `priority` (Enum: 'low', 'medium', 'high')
- `reminder` (Integer, Minutes before event)
- `color` (String, Hex color)
- `user_id` (UUID, Foreign Key)
- `created_at`, `updated_at` (Timestamps)

### Todos
- `id` (UUID, Primary Key)
- `title` (String, Required)
- `description` (Text, Optional)
- `completed` (Boolean, Default: false)
- `due_date` (Date, Optional)
- `priority` (Enum: 'low', 'medium', 'high')
- `user_id` (UUID, Foreign Key)
- `created_at`, `updated_at` (Timestamps)

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- SQL injection prevention with Sequelize ORM
- Environment variable protection

## Browser Support

- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the API health endpoint: `/api/health`
- Review server logs for debugging

---

Built with ❤️ for Korean users, powered by AI assistance.

## Render Deployment Troubleshooting

### Database Connection Issue

If you see the error `Cannot read properties of null (reading 'replace')`, it means the `DATABASE_URL` environment variable is not set. Here's how to fix it:

1. **Create PostgreSQL Database First**
   - Go to Render Dashboard → "New +" → "PostgreSQL"
   - **Name**: `smart-planner-db`
   - **Database Name**: `smart_planner`
   - **User**: `smart_planner_user`
   - **Wait for database to be created**

2. **Get Database Connection String**
   - Go to your database dashboard
   - Copy the "External Database URL" (starts with `postgresql://`)

3. **Set DATABASE_URL in Web Service**
   - Go to your web service → "Environment" tab
   - Add environment variable:
     - **Key**: `DATABASE_URL`
     - **Value**: The connection string from step 2
   - **Important**: Use the "External Database URL", not the internal one

4. **Complete Environment Variables List**
   ```
   NODE_ENV=production
   JWT_SECRET=your-generated-secret-key
   OPENAI_API_KEY=your-openai-api-key
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

5. **Redeploy**
   - Go to "Manual Deploy" and click "Deploy Latest Commit"

### Manual Deployment Steps

If the automatic deployment fails:

1. **Create PostgreSQL Database**
2. **Create Web Service** 
3. **Set all environment variables manually**
4. **Deploy**

The database connection requires SSL in production, which is automatically handled by the updated configuration.
