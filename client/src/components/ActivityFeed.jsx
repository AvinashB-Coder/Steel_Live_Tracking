import { useEffect, useState } from 'react';
import './ActivityFeed.css';

function ActivityFeed() {
  const [activities, setActivities] = useState([
    { id: 1, type: 'dispatch', message: 'Tool dispatched to LVS Chennai', time: '2 mins ago', icon: 'fa-truck' },
    { id: 2, type: 'location', message: 'Location updated - Near Poonamallee', time: '5 mins ago', icon: 'fa-map-marker' },
    { id: 3, type: 'alert', message: 'Speed alert - Vehicle exceeded limit', time: '12 mins ago', icon: 'fa-exclamation-triangle' },
    { id: 4, type: 'checkin', message: 'Vendor check-in completed', time: '1 hour ago', icon: 'fa-check-circle' },
    { id: 5, type: 'update', message: 'ETA updated - 45 mins remaining', time: '2 hours ago', icon: 'fa-clock' },
  ]);

  const [visibleActivities, setVisibleActivities] = useState([]);

  useEffect(() => {
    // Stagger animation for each activity
    activities.forEach((activity, index) => {
      setTimeout(() => {
        setVisibleActivities(prev => [...prev, activity]);
      }, index * 150);
    });
  }, []);

  const getIconColor = (type) => {
    const colors = {
      dispatch: '#079cd4',
      location: '#27ae60',
      alert: '#e74c3c',
      checkin: '#9b59b6',
      update: '#f39c12'
    };
    return colors[type] || '#6c757d';
  };

  return (
    <div className="activity-feed">
      <div className="feed-header">
        <h3><i className="fa fa-history"></i> Recent Activity</h3>
        <button className="view-all-btn">View All</button>
      </div>
      <div className="feed-content">
        {visibleActivities.map((activity) => (
          <div 
            key={activity.id} 
            className="feed-item visible"
            style={{ '--item-color': getIconColor(activity.type) }}
          >
            <div className="feed-item-icon">
              <i className={`fa ${activity.icon}`}></i>
            </div>
            <div className="feed-item-content">
              <p className="feed-message">{activity.message}</p>
              <span className="feed-time">{activity.time}</span>
            </div>
            <div className="feed-item-glow"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityFeed;
