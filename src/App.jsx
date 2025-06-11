import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, X, Settings, Shuffle, GripVertical } from 'lucide-react';

  // Enhanced local storage functions with error checking
const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    
    const parsed = JSON.parse(saved);
    
    // Validate the data based on the key
    if (key === 'taskSaladTasks') {
      // Ensure it's an array with at least one valid task
      if (!Array.isArray(parsed) || parsed.length === 0) {
        console.warn('Invalid tasks data, using defaults');
        return defaultValue;
      }
      // Filter out any invalid tasks (non-strings or empty strings)
      const validTasks = parsed.filter(task => typeof task === 'string' && task.trim().length > 0);
      if (validTasks.length === 0) {
        console.warn('No valid tasks found, using defaults');
        return defaultValue;
      }
      return validTasks;
    }
    
    if (key === 'taskSaladCurrentIndex') {
      // Ensure it's a valid number >= 0
      if (typeof parsed !== 'number' || parsed < 0 || !Number.isInteger(parsed)) {
        console.warn('Invalid currentTaskIndex, using 0');
        return 0;
      }
      return parsed;
    }
    
    if (key === 'taskSaladSessionDuration') {
      // Ensure it's a valid session duration (5-120 minutes)
      if (typeof parsed !== 'number' || parsed < 5 || parsed > 120) {
        console.warn('Invalid sessionDuration, using default');
        return defaultValue;
      }
      return parsed;
    }
    
    if (key === 'taskSaladTimeLeft' || key === 'taskSaladTotalDuration') {
      // Ensure it's a valid number >= 0
      if (typeof parsed !== 'number' || parsed < 0) {
        console.warn(`Invalid ${key}, using default`);
        return defaultValue;
      }
      return parsed;
    }
    
    return parsed;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
};
  
export default function App() {
  const [tasks, setTasks] = useState(() => 
    loadFromLocalStorage('taskSaladTasks', ['Solve World Hunger', 'Take Over the World', 'Train My Pet Dragon', 'Create the Perfect Pizza'])
  );
  const [currentTaskIndex, setCurrentTaskIndex] = useState(() => {
    const savedTasks = loadFromLocalStorage('taskSaladTasks', ['Solve World Hunger', 'Take Over the World', 'Train My Pet Dragon', 'Create the Perfect Pizza']);
    const savedIndex = loadFromLocalStorage('taskSaladCurrentIndex', 0);
    
    // Ensure the index is within bounds of the tasks array
    return Math.min(savedIndex, savedTasks.length - 1);
  });
  const [sessionDuration, setSessionDuration] = useState(() => 
    loadFromLocalStorage('taskSaladSessionDuration', 20)
  );
  const [timeLeft, setTimeLeft] = useState(() => {
    const savedDuration = loadFromLocalStorage('taskSaladSessionDuration', 20);
    return loadFromLocalStorage('taskSaladTimeLeft', savedDuration * 60);
  });
  
  const [totalDuration, setTotalDuration] = useState(() => {
    const savedDuration = loadFromLocalStorage('taskSaladSessionDuration', 20);
    return loadFromLocalStorage('taskSaladTotalDuration', savedDuration * 60);
  });

  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const intervalRef = useRef(null);

  // Fun, encouraging call-to-action phrases
const callToActionPhrases = [
  "Ready to tackle",
  "Let's dive into",
  "Time to focus on",
  "Let's crush",
  "Ready to rock",
  "Time to shine with",
  "Let's make progress on",
  "Ready to excel at",
  "Time to dominate",
  "Let's get after",
  "Ready to master",
  "Time to level up with",
  "Let's conquer",
  "Ready to succeed with",
  "Time to thrive on"
];

// Get a consistent call-to-action for current task
const getCurrentTaskDisplay = () => {
  const task = tasks[currentTaskIndex];
  const phraseIndex = (currentTaskIndex + task.length) % callToActionPhrases.length;
  const phrase = callToActionPhrases[phraseIndex];
  return (
    <>
      {phrase} <span className="text-yellow-200 font-bold">{task}</span>!
    </>
  );
};

// Save tasks when they change
useEffect(() => {
  saveToLocalStorage('taskSaladTasks', tasks);
}, [tasks]);

// Save current task index when it changes
useEffect(() => {
  saveToLocalStorage('taskSaladCurrentIndex', currentTaskIndex);
}, [currentTaskIndex]);

// Save session duration when it changes
useEffect(() => {
  saveToLocalStorage('taskSaladSessionDuration', sessionDuration);
}, [sessionDuration]);

  // Use performance.now() or Date.now() for accurate timing that works in background tabs
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const now = performance.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, totalDuration - elapsed);
        
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          handleTaskComplete();
        }
      }, 100); // Check more frequently for smoother updates
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, startTime, totalDuration]);

  // Handle visibility change to ensure timer accuracy when tab becomes active again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning && startTime) {
        // Tab became active - recalculate time immediately
        const now = performance.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, totalDuration - elapsed);
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          handleTaskComplete();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, startTime, totalDuration]);

  const handleTaskComplete = () => {
    setIsRunning(false);
    const nextTaskIndex = (currentTaskIndex + 1) % tasks.length;
    
    // Play notification sound
    playNotificationSound();
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Time to switch to: ${tasks[nextTaskIndex]}`, {
        body: `You've completed your ${tasks[currentTaskIndex]} session!`,
        icon: '/favicon.ico'
      });
    }
    
    setCurrentTaskIndex(nextTaskIndex);
    const newDuration = sessionDuration * 60;
    setTimeLeft(newDuration);
    setTotalDuration(newDuration);
    setStartTime(null);
  };

  const playNotificationSound = () => {
    // Create a simple notification beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a sequence of beeps
      const playBeep = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      // Play three pleasant beeps
      playBeep(800, now, 0.15);
      playBeep(1000, now + 0.2, 0.15);
      playBeep(1200, now + 0.4, 0.15);
      
    } catch (error) {
      // Fallback: try to play a simple beep
      console.log('Web Audio API not supported, trying fallback sound');
      // This creates a very short beep sound as fallback
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjNFHCurkKIuaa+4fJOLiq6Yrqx3YWTGX1RRKyuRgJ+knK6UrKpfYmLrX1NVJSuYf5qjnq6TqapdYWXsX1BbIyuhf5monK6RpKpcYmfvX05hICujfpOonq6PnqlaYmnyX0xdIyyjfZGonL6MnKhYY2rzX0paJCumfI+pn66Ek6dUZGvwY01XIy2ofY2qn7mKoKRUY2/4Y0tVJy6qfYyrn7eHo6NQY3H/YklWJy6rfoirnrWGoaFNZHNEYkhVJjCtf4eun66CnZ9KZHVFYkZYJzKugIWum6eCnZ5HZHhJYkZYKjKvgYKvmKmDmpxFZXtNY0NZKjOwgoGulaeCmp1CZn5QYkFbKjW0goGukKaFmJlAZ4FVYUJRKDW1g3+ui6eGmJg8aIRZYEJUKjW2hHyuiqmMmJY6aYZcX0JULDa7hHuokKqNmZU4aoldX0FYLTe9hXqpiKqPmpU2a4xhX0FYLjfChHaniayUmZM0a49kX0FaLjfCg3akjq2UmZM0a5BnX0FaLjfCg3ajjq2UmZM0a5BqX0FcLjfDg3ajjq2UmZM0a5BnX0FbLjfDg3ajjq2UmZM0a5BnX0FbLjfBg3ajjq2UmZM0a5BnX0FbLjfBg3ajjq2UmZM0a5BnX0FbLjfDg3ajjq2UmZM0a5BnX0FbLjfDg3ajjq2UmZM0a5BnX0FbLjfDg3WjjqyTmZM0a5BoXEFbLjfEg3SjjqySmZI0a5BpXEFdLjfFg3OjjauSmZI0a5BoXUFdLjfGg3Ijjq2UmZM0a5BnX0FbLjfDg3ajjq2UmZM0a5BnX0FbLjfDg3aijq2VmZMza5FnX0FbLjfDhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZM=');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // If audio fails, at least log that we tried
        console.log('Audio notification not supported');
      });
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      // Starting the timer
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      const now = performance.now();
      setStartTime(now);
      setTotalDuration(timeLeft);
      setIsRunning(true);
    } else {
      // Pausing the timer - update timeLeft to current remaining time
      const now = performance.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeLeft(remaining);
      setIsRunning(false);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(sessionDuration * 60);
    setStartTime(null);
    setTotalDuration(sessionDuration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addTask = () => {
    if (newTask.trim() && !tasks.includes(newTask.trim())) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const removeTask = (index) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
      if (currentTaskIndex >= newTasks.length) {
        setCurrentTaskIndex(0);
      }
    }
  };

  const updateSessionDuration = (minutes) => {
    setSessionDuration(minutes);
    if (!isRunning) {
      setTimeLeft(minutes * 60);
      setTotalDuration(minutes * 60);
    }
  };

  const shuffleTasks = () => {
    const shuffled = [...tasks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setTasks(shuffled);
    // Keep current task index pointing to the same task name
    const currentTaskName = tasks[currentTaskIndex];
    const newIndex = shuffled.findIndex(task => task === currentTaskName);
    setCurrentTaskIndex(newIndex);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newTasks = [...tasks];
    const draggedTask = newTasks[draggedIndex];
    
    // Remove the dragged item
    newTasks.splice(draggedIndex, 1);
    
    // Insert at new position
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newTasks.splice(adjustedDropIndex, 0, draggedTask);
    
    // Update current task index to follow the moved task
    let newCurrentIndex = currentTaskIndex;
    if (currentTaskIndex === draggedIndex) {
      newCurrentIndex = adjustedDropIndex;
    } else if (draggedIndex < currentTaskIndex && adjustedDropIndex >= currentTaskIndex) {
      newCurrentIndex = currentTaskIndex - 1;
    } else if (draggedIndex > currentTaskIndex && adjustedDropIndex <= currentTaskIndex) {
      newCurrentIndex = currentTaskIndex + 1;
    }
    
    setTasks(newTasks);
    setCurrentTaskIndex(newCurrentIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const progress = ((sessionDuration * 60 - timeLeft) / (sessionDuration * 60)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Task Salad</h1>
          <div className="text-sm text-gray-600 mb-4">
            Task {currentTaskIndex + 1} of {tasks.length}
          </div>
          
          {/* Current Task Display */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-4 mb-6">
            <h2 className="text-xl font-semibold">{getCurrentTaskDisplay()}</h2>
          </div>

          {/* Progress Ring */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className="text-indigo-500 transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800">{formatTime(timeLeft)}</div>
                <div className="text-sm text-gray-500">{sessionDuration} min session</div>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                isRunning
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>
            
            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-500 hover:bg-gray-600 text-white font-semibold transition-all"
            >
              <RotateCcw size={20} />
              Reset
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* Next Task Preview */}
          <div className="text-sm text-gray-600">
            Up next: <span className="font-semibold text-indigo-600">
              {tasks[(currentTaskIndex + 1) % tasks.length]}
            </span>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            
            {/* Session Duration */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Duration (minutes)
              </label>
              <div className="flex gap-2">
                {[15, 20, 25, 30].map(minutes => (
                  <button
                    key={minutes}
                    onClick={() => updateSessionDuration(minutes)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      sessionDuration === minutes
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>

            {/* Task Management */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Manage Tasks
                </label>
                <button
                  onClick={shuffleTasks}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-all"
                >
                  <Shuffle size={14} />
                  Shuffle
                </button>
              </div>
              
              {/* Add Task */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add new task..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button
                  onClick={addTask}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Task List with Drag and Drop */}
              <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-1">Drag to reorder:</div>
                {tasks.map((task, index) => (
                  <div
                    key={`${task}-${index}`}
                    draggable={tasks.length > 1}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all cursor-move ${
                      index === currentTaskIndex
                        ? 'bg-indigo-100 border border-indigo-300 text-indigo-800'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    } ${
                      dragOverIndex === index ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''
                    } ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    {tasks.length > 1 && (
                      <GripVertical size={14} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`flex-1 ${index === currentTaskIndex ? 'font-semibold' : ''}`}>
                      {task}
                    </span>
                    {tasks.length > 1 && (
                      <button
                        onClick={() => removeTask(index)}
                        className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
