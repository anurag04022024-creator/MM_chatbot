import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { ChatArea } from './components/chat/ChatArea';
import { ArtifactPanel } from './components/artifacts/ArtifactPanel';
import { ImageGeneratorModal } from './components/image/ImageGeneratorModal';
import { LibraryView } from './components/library/LibraryView';
import { VoiceModeModal } from './components/voice/VoiceModeModal';
import { ProjectsModal } from './components/projects/ProjectsModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { SettingsModal } from './components/modals/SettingsModal';
import { LightboxModal } from './components/modals/LightboxModal';
import { ToastContainer } from './components/ui/Toast';
import { DropOverlay } from './components/ui/DropOverlay';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useThemeStore } from './store/useThemeStore';
import { useChatStore } from './store/useChatStore';
import { generateId } from './lib/utils';
import type { Attachment } from './types/chat';
import type { ArtifactItem } from './lib/db';

export const App: React.FC = () => {
  const { applyTheme } = useThemeStore();
  const { addAttachment, addToast } = useChatStore();

  // Modals state
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);

  // Active Artifact state for resizable right panel
  const [activeArtifact, setActiveArtifact] = useState<ArtifactItem | null>(null);

  // Initialize theme
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Global keyboard shortcuts (⌘K, ⌘Shift+O, Esc)
  useKeyboardShortcuts();

  // Global Drag-and-drop
  const { isDragging } = useDragAndDrop({
    onFilesDropped: (files) => {
      files.forEach((file) => {
        if (file.size > 25 * 1024 * 1024) {
          addToast(`File ${file.name} exceeds 25 MB limit`, 'error');
          return;
        }

        let type: 'image' | 'audio' | 'document' = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('audio/')) type = 'audio';

        const url = URL.createObjectURL(file);
        const attachment: Attachment = {
          id: generateId(),
          name: file.name,
          type,
          mimeType: file.type,
          size: file.size,
          url,
          thumbnailUrl: type === 'image' ? url : undefined,
        };
        addAttachment(attachment);
      });
      addToast(`Attached ${files.length} file(s)`, 'success');
    },
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg dark:bg-brand-darkBg text-brand-text dark:text-brand-darkText">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      {/* Mobile Slide Drawer */}
      <MobileDrawer />

      {/* Main Conversation & Composer View */}
      <ChatArea onOpenImageGen={() => setIsImageGenOpen(true)} />

      {/* Resizable Right-side Artifact Panel (like Claude's Artifacts) */}
      {activeArtifact && (
        <ArtifactPanel
          artifact={activeArtifact}
          onClose={() => setActiveArtifact(null)}
        />
      )}

      {/* Overlays & Modals */}
      <CommandPalette />
      <SettingsModal />
      <LightboxModal />
      <ProjectsModal isOpen={isProjectsOpen} onClose={() => setIsProjectsOpen(false)} />
      <LibraryView isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
      <VoiceModeModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
      <ImageGeneratorModal isOpen={isImageGenOpen} onClose={() => setIsImageGenOpen(false)} />
      <ToastContainer />
      <DropOverlay isDragging={isDragging} />
    </div>
  );
};

export default App;
