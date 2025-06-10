# 🥗 Task Salad

A fun, encouraging Pomodoro timer that automatically rotates through different tasks with motivational call-to-action messages to help you stay energized and balanced. If you're like me, the longer you work on task A the more your brain tells you, "What about task B! You're ignoring task B! Working on task B would be so much more fun and interesting!" Thus this timer was born. Label all the different tasks you want to work on, and Task Salad will help you focus on just one at a time, relaxing in the knowledge that in a few minutes you'll get to work on something else.

## ✨ Features

- **🔄 Smart Task Rotation**: Automatically cycles through your tasks with fresh energy each time
- **⏱️ Customizable Sessions**: Choose between 15, 20, 25, or 30-minute sessions
- **📊 Visual Progress**: Beautiful circular progress indicator
- **🎯 Task Management**: Add, remove, drag-and-drop reorder, and shuffle tasks
- **🔔 Multi-Modal Notifications**: Desktop notifications + audio alerts
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🕒 Background Tab Support**: Keeps accurate time even when tab is not active
- **🎵 Audio Notifications**: Pleasant beep sequence when sessions complete
- **🐳 Docker Ready**: Easy self-hosting with Docker

## 🚀 Quick Start with Docker

### Option 1: Docker Compose (Recommended)
1. **Download the files** or clone this repository
2. **Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```
3. **Open your browser** to `http://localhost:3000`
4. To change the port, modify `docker-compose.yml` accordingly.

### Option 3: Build from Source
```bash
# Clone or download the project files
cd task-salad

# Build the Docker image
docker build -t task-salad .

# Run the container
docker run -d -p 3000:80 --name task-salad task-salad
```

## 🛠️ Local Development

If you want to customize or develop locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Usage

1. **Start the timer** and focus on your current task
2. **Get notified** when it's time to switch (audio + desktop notification)
3. **Automatically advances** to the next task in your rotation
4. **Customize your tasks** in the settings panel:
   - Add/remove tasks
   - Drag and drop to reorder
   - Shuffle for variety
   - Adjust session duration

## ⚙️ Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` for production builds
- Port is configured to run on port 80 inside the container, mapped to 3000 on host

### Reverse Proxy Setup
The included `docker-compose.yml` has Traefik labels for easy reverse proxy setup. Customize the domain in the labels:

```yaml
labels:
  - "traefik.http.routers.pomodoro.rule=Host(`pomodoro.yourdomain.com`)"
```

### Nginx Configuration
The container includes optimized nginx configuration with:
- Gzip compression
- Security headers
- Static asset caching
- SPA routing support

## 🔧 Customization

### Default Tasks
Edit the initial tasks in `src/App.jsx`:
```javascript
const [tasks, setTasks] = useState(['Your Task 1', 'Your Task 2', 'Your Task 3']);
```

### Session Durations
Modify available durations in the settings:
```javascript
{[15, 20, 25, 30, 45].map(minutes => (
  // ... duration buttons
))}
```

### Styling
The app uses Tailwind CSS. Customize colors and styling in the component classes.

## 🔒 Security Features

- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- No external dependencies loaded at runtime
- Minimal attack surface with static file serving

## 📱 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: Responsive design works on all modern mobile browsers

**Note**: Desktop notifications require user permission. Audio notifications work without permission.

## 🙏 Acknowledgments

- This entire project was coded in an afternoon with Claude.ai's help.
- Built with React + Vite for fast development
- Icons from Lucide React
- Styled with Tailwind CSS
- Containerized with Docker + Nginx

---

**Happy Pomodoro-ing! 🍅⏰**
