"use client";
import React from 'react';

export default function RecentActivity(){
  const items = [
    { id: 1, icon: '👤', title: 'New user registered', time: '2m' },
    { id: 2, icon: '🧾', title: 'Invoice #125 created', time: '10m' }
  ];
  return (
    <div className="recent-activity">
      <h3>Recent Activity</h3>
      <div className="activity-list">
        {items.map(i => (
          <div key={i.id} className="activity-item">
            <div className="activity-icon">{i.icon}</div>
            <div className="activity-content">
              <div className="activity-title">{i.title}</div>
              <div className="activity-time">{i.time} ago</div>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .recent-activity{ background:var(--background); border:1px solid var(--border-color); border-radius:8px; padding:16px }
        .activity-list{ display:flex; flex-direction:column; gap:8px }
        .activity-item{ display:flex; gap:8px; align-items:center }
        .activity-icon{ width:36px; height:36px; border-radius:50%; background:var(--background-secondary); display:flex; align-items:center; justify-content:center }
      `}</style>
    </div>
  );
}
