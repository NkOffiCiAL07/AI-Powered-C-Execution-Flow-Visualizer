import React, { useState } from 'react';
import '../styles/FileExplorer.css';

export default function FileExplorer({ 
  files, 
  currentFile, 
  onOpenFile, 
  onAddFile, 
  onDeleteFile, 
  onRenameFile 
}) {
  const [isEditing, setIsEditing] = useState(null); // id of file being renamed
  const [editName, setEditName] = useState('');

  const handleStartRename = (e, file) => {
    e.stopPropagation();
    setIsEditing(file.id);
    setEditName(file.name);
  };

  const handleFinishRename = (fileId) => {
    if (editName.trim() && editName !== files.find(f => f.id === fileId)?.name) {
      onRenameFile(fileId, editName.trim());
    }
    setIsEditing(null);
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <span className="material-symbols-outlined explorer-icon">folder_open</span>
        <span className="explorer-title">Files</span>
        <button className="add-file-btn" onClick={onAddFile} title="New file">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="file-list">
        {files.length === 0 ? (
          <div className="empty-files">No files in project</div>
        ) : (
          files.map(file => {
            const isActive = currentFile?.id === file.id;
            const ext = file.name.split('.').pop() || 'file';
            
            return (
              <div 
                key={file.id} 
                className={`file-item ${isActive ? 'active' : ''}`}
                onClick={() => !isEditing && onOpenFile(file)}
              >
                <span className={`material-symbols-outlined file-type-icon ${ext}`}>
                  {ext === 'cpp' || ext === 'c' ? 'code' : ext === 'py' ? 'terminal' : 'description'}
                </span>

                {isEditing === file.id ? (
                  <input
                    className="file-rename-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleFinishRename(file.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename(file.id);
                      if (e.key === 'Escape') setIsEditing(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="file-name">{file.name}</span>
                )}

                {!isEditing && (
                  <div className="file-actions">
                    <button onClick={(e) => handleStartRename(e, file)} title="Rename">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }} title="Delete">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
