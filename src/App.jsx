import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, X, Settings, Shuffle, GripVertical, CheckCircle, SkipForward } from 'lucide-react';

  
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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(5 * 60); // 5 minute break
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [breakCount, setBreakCount] = useState(() => 
  loadFromLocalStorage('taskSaladBreakCount', 0)
);
const [lastBreakDate, setLastBreakDate] = useState(() => 
  loadFromLocalStorage('taskSaladLastBreakDate', null)
);
const [currentBreakMessage, setCurrentBreakMessage] = useState(() => {
  const breakActivities = [
    "Stretch!",
    "Find one thing on your desk that doesn't belong and put it away. Ah, sweet order.",
    "Time for a victory lap!",
    "Go hydrate! 🌱", 
    "Dance Break! 💃",
    "Take three slow, deep breaths. Inhale the good vibes, exhale the stress.",
    "Look out the window 🪟",
    "Engage in a staring contest with the nearest inanimate object. Don't let the stapler win.",
    "Try to balance a pen on your nose.",      
    "Rest your eyes. Look at something at least 20 feet away. No, your phone doesn't count.",
    "Grab a healthy snack! 🍎",
    "Give your hands a break. Wiggle your fingers, then gently stretch your wrists.",
    "Think of one thing you're grateful for right now."
  ];
  return breakActivities[Math.floor(Math.random() * breakActivities.length)];
});

  const [continuousBeeping, setContinuousBeeping] = useState(false);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
const [completedTaskName, setCompletedTaskName] = useState('');

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

  const [currentCompleteEmoji, setCurrentCompleteEmoji] = useState(() => {
    const completeEmojis = ['😊', '🎉', '✨', '💪', '🚀', '👏', '🌟', '😄', '🎊', '💫'];
    return completeEmojis[Math.floor(Math.random() * completeEmojis.length)];
  });
  
  const [currentSkipEmoji, setCurrentSkipEmoji] = useState(() => {
    const skipEmojis = ['😔', '😐', '😅', '🤷‍♀️', '🤷‍♂️', '😬', '🙃', '😕', '🤪', '😵‍💫'];
    return skipEmojis[Math.floor(Math.random() * skipEmojis.length)];
  });

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

const getBreakDuration = () => {
  const today = new Date().toDateString();
  
  // Reset count if it's a new day or been more than 4 hours
  if (lastBreakDate !== today) {
    setBreakCount(0);
    setLastBreakDate(today);
    return 5 * 60; // 5 minutes for first break of the day
  }
  
  // Every 4th break is longer
  const nextBreakCount = breakCount + 1;
  const isLongBreak = nextBreakCount % 4 === 0;
  
  return isLongBreak ? 10 * 60 : 5 * 60; // 10 minutes vs 5 minutes
};

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

useEffect(() => {
  // Initialize Google Analytics
  if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag; // Make gtag available globally
    gtag('js', new Date());
    gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID);
  }
}, []);

useEffect(() => {
  // Check if this is the user's first time
  const hasVisited = localStorage.getItem('taskSaladHasVisited');
  if (!hasVisited) {
    setShowWelcomeModal(true);
    localStorage.setItem('taskSaladHasVisited', 'true');
  }
}, []);
// Save break count when it changes
useEffect(() => {
  saveToLocalStorage('taskSaladBreakCount', breakCount);
}, [breakCount]);

// Save last break date when it changes
useEffect(() => {
  saveToLocalStorage('taskSaladLastBreakDate', lastBreakDate);
}, [lastBreakDate]);

// Break timer logic
useEffect(() => {
  if (isOnBreak && breakStartTime) {
    const breakInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = Math.floor((now - breakStartTime) / 1000);
      const remaining = Math.max(0, breakDuration - elapsed);
      
      setBreakTimeLeft(remaining);
      
      if (remaining === 0) {
        console.log('Break time is over');
        // Break is over - start continuous beeping
        setBreakStartTime(null);
        startContinuousBeeping(); // Start continuous beeping instead of single beep
      }
        }, 100);
    
    return () => clearInterval(breakInterval);
  }
}, [isOnBreak, breakStartTime, breakDuration]);

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

  useEffect(() => {
    let beepInterval;
    
    if (continuousBeeping) {
      beepInterval = setInterval(() => {
        playNotificationSound();
      }, 3000); // Beep every 3 seconds
    }
    
    return () => {
      if (beepInterval) {
        clearInterval(beepInterval);
      }
    };
  }, [continuousBeeping]);

  const handleTaskComplete = () => {
    setIsRunning(false);
    const nextTaskIndex = (currentTaskIndex + 1) % tasks.length;
    
    // Store completed task name and show modal
    setCompletedTaskName(tasks[currentTaskIndex]);
    setShowCompletionModal(true);
    
    // Play notification sound
    startContinuousBeeping();
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const nextTaskPhrase = callToActionPhrases[(nextTaskIndex + tasks[nextTaskIndex].length) % callToActionPhrases.length];
      new Notification(`${nextTaskPhrase} ${tasks[nextTaskIndex]}!`, {
        body: `You've completed your ${tasks[currentTaskIndex]} session! 🎉`,
        icon: '/favicon.ico'
      });
    }
    
    setCurrentTaskIndex(nextTaskIndex);
    const newDuration = sessionDuration * 60;
    setTimeLeft(newDuration);
    setTotalDuration(newDuration);
    setStartTime(null);
    
    setCurrentCompleteEmoji(completeEmojis[Math.floor(Math.random() * completeEmojis.length)]);
    setCurrentSkipEmoji(skipEmojis[Math.floor(Math.random() * skipEmojis.length)]);
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
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjNFHCurkKIuaa+4fJOLiq6Yrqx3YWTGX1RRKyuRgJ+knK6UrKpfYmLrX1NVJSuYf5qjnq6TqapdYWXsX1BbIyuhf5monK6RpKpcYmfvX05hICujfpOonq6PnqlaYmnyX0xdIyyjfZGonL6MnKhYY2rzX0paJCumfI+pn66Ek6dUZGvwY01XIy2ofY2qn7mKoKRUY2/4Y0tVJy6qfYyrn7eHo6NQY3H/YklWJy6rfoirnrWGoaFNZHNEYkhVJjCtf4eun66CnZ9KZHVFYkZYJzKugIWum6eCnZ5HZHhJYkZYKjKvgYKvmKmDmpxFZXtNY0NZKjOwgoGulaeCmp1CZn5QYkFbKjW0goGukKaFmJlAZ4FVYUJRKDW1g3+ui6eGmJg8aIRZYEJUKjW2hHyuiqmMmJY6aYZcX0JULDa7hHuokKqNmZU4aoldX0FYLTe9hXqpiKqPmpU2a4xhX0FYLjfChHaniayUmZM0a49kX0FaLjfCg3akjq2UmZM0a5BnX0FaLjfCg3ajjq2UmZM0a5BqX0FcLjfDg3ajjq2UmZM0a5BnX0FbLjfDg3ajjq2UmZM0a5BnX0FbLjfBg3ajjq2UmZM0a5BnX0FbLjfBg3ajjq2UmZM0a5BnX0FbLjfDg3ajjq2UmZM0a5BnX0FbLjfDg3ajjq2UmZM0a5BnX0FbLjfDg3WjjqyTmZM0a5BoXEFbLjfEg3SjjqySmZI0a5BpXEFdLjfFg3OjjauSmZI0a5BoXUFdLjfGg3Ijjq2UmZM0a5BnX0FbLjfDg3ajjq2UmZM0a5BnX0FbLjfDg3aijq2VmZMza5FnX0FbLjfDhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZMza5FnX0FbLjfEhHaijq2VmZM=');
    audio.volume = 0.3;
    audio.play().catch(() => {
      console.log('Audio notification not supported');
    });
  }
};

const startContinuousBeeping = () => {
  setContinuousBeeping(true);
  playNotificationSound();
};

const stopContinuousBeeping = () => {
  setContinuousBeeping(false);
};
const completeCurrentTask = () => {
  // Store completed task name and show modal
  setCompletedTaskName(tasks[currentTaskIndex]);
  setShowCompletionModal(true);
  
  setIsRunning(false);
  
  // Play celebration sound
  playNotificationSound();

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`Great job! 🎉`, {
      body: `You completed ${tasks[currentTaskIndex]} early!`,
      icon: '/favicon.ico'
    });
  }
  
  // Move to next task
  const nextTaskIndex = (currentTaskIndex + 1) % tasks.length;
  setCurrentTaskIndex(nextTaskIndex);
  const newDuration = sessionDuration * 60;
  setTimeLeft(newDuration);
  setTotalDuration(newDuration);
  setStartTime(null);
  
  setCurrentCompleteEmoji(completeEmojis[Math.floor(Math.random() * completeEmojis.length)]);
  setCurrentSkipEmoji(skipEmojis[Math.floor(Math.random() * skipEmojis.length)]);
  setCurrentBreakMessage(breakActivities[Math.floor(Math.random() * breakActivities.length)]);
};

  const skipCurrentTask = () => {
    setIsRunning(false);
    
    // Move to the task after next (skip one)
    const nextTaskIndex = (currentTaskIndex + 1) % tasks.length;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Skipped ${tasks[currentTaskIndex]}`, {
        body: `Moving to ${tasks[nextTaskIndex]} instead`,
        icon: '/favicon.ico'
      });
    }
    
    setCurrentTaskIndex(nextTaskIndex);
    const newDuration = sessionDuration * 60;
    setTimeLeft(newDuration);
    setTotalDuration(newDuration);
    setStartTime(null);

  setCurrentCompleteEmoji(completeEmojis[Math.floor(Math.random() * completeEmojis.length)]);
  setCurrentSkipEmoji(skipEmojis[Math.floor(Math.random() * skipEmojis.length)]);
  setCurrentBreakMessage(breakActivities[Math.floor(Math.random() * breakActivities.length)]);
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

       // Track Google Analytics event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'start_timer', {
          event_category: 'timer',
          event_label: tasks[currentTaskIndex],
          value: sessionDuration
        });
      }
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
onClick={() => {
  setShowSettings(!showSettings);
  // Scroll to settings when opened
  if (!showSettings) {
    setTimeout(() => {
      const settingsElement = document.getElementById('settings-panel');
      if (settingsElement) {
        settingsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }
}}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
            >
              <Settings size={20} />
            </button>
          </div>

                  {/* Settings Panel */}
        {showSettings && (
          <div id="settings-panel" className="border border-gray-200 bg-gray-50 rounded-xl p-4 mb-6 animate-in slide-in-from-top duration-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Settings</h3>
            
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
                  className="flex-1 px-3 py-2 border bg-white border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

{/* Quick Actions Section */}
<div className="border-t border-gray-200 pt-4 mb-4">
  <h3 className="text-sm font-medium text-gray-600 mb-3 text-center">Quick Actions</h3>
  <div className="flex justify-center">
    {isRunning ? (
      <button
        onClick={completeCurrentTask}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-all"
      >
        <CheckCircle size={16} />
        Done! {currentCompleteEmoji}

      </button>
    ) : (
      <button
        onClick={skipCurrentTask}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium transition-all"
      >
        <SkipForward size={16} />
        Skip {currentSkipEmoji}

      </button>
    )}
  </div>
</div>

{/* Next Task Preview */}
{tasks.length > 1 && (
  <div className="text-sm text-gray-600">
    Up next: <span className="font-semibold text-indigo-600">
      {tasks[(currentTaskIndex + 1) % tasks.length]}
    </span>
  </div>
)}          
        </div>

      </div>
        

{showCompletionModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center bounce-few">
      {!isOnBreak ? (
        // Completion celebration phase
        <>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Time's Up!</h2>
          <p className="text-lg text-gray-600 mb-1">You completed:</p>
          <p className="text-xl font-semibold text-green-600 mb-4">{completedTaskName}</p>
          <p className="text-gray-500 mb-6">Time for a well-deserved break! 🌟</p>
          
          <button
  onClick={() => {
    stopContinuousBeeping();
    setIsOnBreak(true);
    setBreakStartTime(performance.now());
    
    // Calculate break duration and update count
    const duration = getBreakDuration();
    setBreakDuration(duration);
    setBreakTimeLeft(duration);
    
    // Update break count and date
    const today = new Date().toDateString();
    setLastBreakDate(today);
    setBreakCount(prev => prev + 1);
  }}
  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all"
>
  Start Break! ☕
</button>
        </>
      ) : (
        // Break countdown phase
        // Break countdown phase
<>
  {breakTimeLeft > 0 ? (
    // Still on break
    <>
      <div className="text-6xl mb-4">☕</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Break Time!</h2>
      <p className="text-lg text-green-600 mb-4">{currentBreakMessage}</p>
      
      {/* Break Timer Display */}
      <div className="relative w-32 h-32 mx-auto mb-6">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
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
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - (breakDuration - breakTimeLeft) / breakDuration)}`}
            className="text-blue-500 transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{formatTime(breakTimeLeft)}</div>
            <div className="text-xs text-gray-500">break time</div>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => {
          setIsOnBreak(false);
          setShowCompletionModal(false);
          setBreakStartTime(null);
        }}
        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-all"
      >
        Skip Break 😅
      </button>
    </>
  ) : (
    // Break is over - show "Break's Over" state
    <>
      <div className="text-6xl mb-4 animate-bounce">⏰</div>
      <h2 className="text-2xl font-bold text-red-600 mb-2">Break's Over!</h2>
      <p className="text-lg text-gray-600 mb-4">Time to get back to work! 💪</p>
      <p className="text-sm text-gray-500 mb-6">Ready for your next task?</p>
      
      <button
        onClick={() => {
          stopContinuousBeeping();
          setIsOnBreak(false);
          setShowCompletionModal(false);
        }}
        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all animate-pulse"
      >
        Back to Work! 🚀
      </button>
    </>
  )}
</>
      )}
    </div>
  </div>
)}
{showWelcomeModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
      <div className="text-6xl mb-4">🥗</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Task Salad!</h2>
      <p className="text-gray-600 mb-4">
        A focused work pomodoro timer that helps you tackle multiple tasks one at a time. 
        Pick your tasks, set your session duration, and enjoy your well-earned breaks. Time to get productive!
      </p>
      <button
        onClick={() => setShowWelcomeModal(false)}
        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all"
      >
        Let's Get Started! 🚀
      </button>
    </div>
  </div>
)}
</div>
  );
}