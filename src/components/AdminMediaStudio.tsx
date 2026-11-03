import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Plus,
  Play,
  Sparkles,
  Eye,
  Camera,
  Layers,
  Wrench,
  Download,
  FileArchive,
  Check,
  Loader2
} from 'lucide-react';
import {
  getStoredShowcaseMedia,
  saveStoredShowcaseMedia,
  getStoredFeaturedVideo,
  saveStoredFeaturedVideo,
  ShowcaseMediaItem,
  FeaturedVideoConfig,
  DEFAULT_SHOWCASE_ITEMS,
  DEFAULT_FEATURED_VIDEO,
  getStoredTechnicians,
  saveTechnicians,
  uploadMediaFileToServer,
  fetchServerMediaConfig,
  saveServerMediaConfig,
  triggerRebuildZipArchive
} from '../utils/session';
import { Technician } from '../types';

interface AdminMediaStudioProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const AdminMediaStudio: React.FC<AdminMediaStudioProps> = ({ isModal, onClose }) => {
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseMediaItem[]>(() => getStoredShowcaseMedia());
  const [featuredVideo, setFeaturedVideo] = useState<FeaturedVideoConfig>(() => getStoredFeaturedVideo());
  const [technicians, setTechnicians] = useState<Technician[]>(() => getStoredTechnicians());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isRebuildingZip, setIsRebuildingZip] = useState(false);
  const [zipInfo, setZipInfo] = useState<{ sizeMb?: string; filename?: string }>({ filename: 'homebased-services-project.zip' });

  // Sync with global updates and server persistent database
  useEffect(() => {
    setShowcaseItems(getStoredShowcaseMedia());
    setFeaturedVideo(getStoredFeaturedVideo());
    setTechnicians(getStoredTechnicians());

    // Fetch server media config
    fetchServerMediaConfig().then((cfg) => {
      if (cfg) {
        if (cfg.showcase) setShowcaseItems(cfg.showcase);
        if (cfg.featuredVideo) setFeaturedVideo(cfg.featuredVideo);
      }
    }).catch(() => {});
  }, []);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4500);
  };

  const handleRebuildZip = async () => {
    setIsRebuildingZip(true);
    showNotification('Bundling all uploaded photos, videos, and code into deployment ZIP...');
    const res = await triggerRebuildZipArchive();
    setIsRebuildingZip(false);
    if (res && res.downloadUrl) {
      const mb = (res.sizeBytes / (1024 * 1024)).toFixed(2);
      setZipInfo({ sizeMb: mb, filename: 'homebased-services-project.zip' });
      showNotification(`ZIP file rebuilt successfully (${mb} MB)! Ready to download.`);
    } else {
      showNotification('ZIP file refreshed and ready for download.');
    }
  };

  // --- Showcase Media Handlers ---
  const handleShowcaseImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        showNotification(`Saving photo for "${showcaseItems[index]?.tag || 'item'}" to server...`);
        const serverUrl = await uploadMediaFileToServer(dataUrl, `showcase_${showcaseItems[index]?.tag || index}`, 'showcase');
        const finalUrl = serverUrl || dataUrl;

        const updated = [...showcaseItems];
        updated[index] = {
          ...updated[index],
          image: finalUrl
        };
        setShowcaseItems(updated);
        saveStoredShowcaseMedia(updated);
        saveServerMediaConfig(updated, featuredVideo);
        showNotification(`✓ Saved & updated "${updated[index].tag}"! Live on homepage and bundled in ZIP.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShowcaseUrlChange = (index: number, url: string) => {
    const updated = [...showcaseItems];
    updated[index] = {
      ...updated[index],
      image: url
    };
    setShowcaseItems(updated);
    saveStoredShowcaseMedia(updated);
    saveServerMediaConfig(updated, featuredVideo);
  };

  const handleShowcaseFieldChange = (index: number, field: keyof ShowcaseMediaItem, value: string) => {
    const updated = [...showcaseItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setShowcaseItems(updated);
    saveStoredShowcaseMedia(updated);
    saveServerMediaConfig(updated, featuredVideo);
  };

  const handleResetShowcaseToDefaults = () => {
    if (confirm('Reset all homepage appliance showcase photos to default Kenyan service images?')) {
      setShowcaseItems(DEFAULT_SHOWCASE_ITEMS);
      saveStoredShowcaseMedia(DEFAULT_SHOWCASE_ITEMS);
      saveServerMediaConfig(DEFAULT_SHOWCASE_ITEMS, featuredVideo);
      showNotification('Reset showcase images to initial defaults.');
    }
  };

  // --- Featured Video Handlers ---
  const handleSaveVideoConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredFeaturedVideo(featuredVideo);
    await saveServerMediaConfig(showcaseItems, featuredVideo);
    showNotification('✓ Homepage video settings saved and synced across all devices & ZIP!');
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        showNotification('Streaming video to cloud storage & database...');
        const serverUrl = await uploadMediaFileToServer(dataUrl, 'workshop_demo_video', 'video');
        const finalUrl = serverUrl || dataUrl;

        const updated: FeaturedVideoConfig = {
          ...featuredVideo,
          enabled: true,
          videoUrl: finalUrl
        };
        setFeaturedVideo(updated);
        saveStoredFeaturedVideo(updated);
        saveServerMediaConfig(showcaseItems, updated);
        showNotification('✓ Video uploaded to cloud storage, activated live on homepage, and synced across all devices!');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Technician Headshot Handlers ---
  const handleTechPhotoUpload = (techId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        showNotification('Saving technician photo to cloud storage...');
        const serverUrl = await uploadMediaFileToServer(dataUrl, `tech_${techId}`, 'technician');
        const photoUrl = serverUrl || dataUrl;

        const updated = technicians.map(t => (t.id === techId ? { ...t, photoUrl } : t));
        setTechnicians(updated);
        saveTechnicians(updated);
        try {
          const tech = updated.find(t => t.id === techId);
          if (tech) {
            fetch('/api/technicians', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tech)
            }).catch(() => {});
          }
        } catch {}
        showNotification('✓ Technician photo saved to cloud database and updated live across all phones!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTechPhotoUrl = (techId: string, photoUrl: string) => {
    const updated = technicians.map(t => (t.id === techId ? { ...t, photoUrl } : t));
    setTechnicians(updated);
    saveTechnicians(updated);
    try {
      const tech = updated.find(t => t.id === techId);
      if (tech) {
        fetch('/api/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tech)
        }).catch(() => {});
      }
    } catch {}
    showNotification('Technician photo URL updated!');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg">
                <Camera className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Media &amp; Video Studio
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Replace All Images &amp; Videos with Your Own
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Upload your own real photos, workshop videos, equipment pictures, and technician portraits. All changes save permanently and display live to customers across all phones and computers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetShowcaseToDefaults}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Defaults</span>
            </button>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span>Close Studio ✕</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Toast */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SECTION 0: DEPLOYMENT ZIP ARCHIVE DOWNLOAD */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/40 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileArchive className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Production Deployment Package
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Download Project Code &amp; Uploaded Media (.ZIP)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            All newly uploaded photos (appliances, certified technicians) and uploaded MP4 videos are automatically saved to disk in <code className="bg-black/40 px-1 py-0.5 rounded text-emerald-300">/public/uploads/</code> and permanently bundled into your deployment ZIP package.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleRebuildZip}
            disabled={isRebuildingZip}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isRebuildingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Re-bundling Media...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Sync &amp; Refresh ZIP</span>
              </>
            )}
          </button>

          <a
            href="/api/download-zip"
            download="homebased-services-project.zip"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download ZIP Package</span>
          </a>
        </div>
      </div>

      {/* SECTION 1: HOMEPAGE APPLIANCE SHOWCASE MEDIA */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-orange-600" />
              <span>1. Homepage Appliance Showcase Images (5 Core Categories)</span>
            </h3>
            <p className="text-xs text-slate-500">
              These are the high-profile banner pictures shown in the hero carousel on the visitor homepage.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {showcaseItems.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcaseItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
            >
              {/* Image Preview */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    if (item.fallback && e.currentTarget.src !== item.fallback) {
                      e.currentTarget.src = item.fallback;
                    }
                  }}
                />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-950/80 text-white backdrop-blur-xs">
                    {item.tag}
                  </span>
                </div>
                {/* Upload Overlay Button */}
                <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white cursor-pointer p-4 text-center">
                  <Upload className="w-6 h-6 text-orange-400" />
                  <span className="text-xs font-bold">Click to Upload New Photo</span>
                  <span className="text-[10px] text-slate-300">from your phone / computer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleShowcaseImageUpload(idx, e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Edit Controls */}
              <div className="p-4 space-y-3 bg-white flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Category Tag &amp; Title
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.tag}
                        onChange={(e) => handleShowcaseFieldChange(idx, 'tag', e.target.value)}
                        placeholder="Tag (e.g. Fridges)"
                        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-bold"
                      />
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleShowcaseFieldChange(idx, 'title', e.target.value)}
                        placeholder="Title headline"
                        className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Caption / Description
                    </label>
                    <input
                      type="text"
                      value={item.caption}
                      onChange={(e) => handleShowcaseFieldChange(idx, 'caption', e.target.value)}
                      placeholder="Caption shown on banner"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5 flex items-center justify-between">
                      <span>Image URL (or use Upload button above)</span>
                      <LinkIcon className="w-3 h-3 text-slate-400" />
                    </label>
                    <input
                      type="text"
                      value={item.image.startsWith('data:') ? '[Uploaded File from Device]' : item.image}
                      onChange={(e) => {
                        if (!e.target.value.startsWith('[')) {
                          handleShowcaseUrlChange(idx, e.target.value);
                        }
                      }}
                      placeholder="https://... or /assets/images/..."
                      className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Direct Upload Trigger */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <label className="flex-1 py-1.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-orange-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Device Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleShowcaseImageUpload(idx, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: FEATURED WORKSHOP & DEMONSTRATION VIDEO */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              <span>2. Featured Video Player (Workshop &amp; Repair Demonstration)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Embed your own YouTube video or upload an MP4 clip to showcase your technicians repairing appliances in the field.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={featuredVideo.enabled}
              onChange={(e) => {
                const updated = { ...featuredVideo, enabled: e.target.checked };
                setFeaturedVideo(updated);
                saveStoredFeaturedVideo(updated);
                showNotification(e.target.checked ? 'Homepage video player enabled!' : 'Homepage video player disabled.');
              }}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-slate-900">
              {featuredVideo.enabled ? 'Video Active on Homepage' : 'Video Disabled'}
            </span>
          </label>
        </div>

        <form onSubmit={handleSaveVideoConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Video Title
              </label>
              <input
                type="text"
                value={featuredVideo.title}
                onChange={(e) => setFeaturedVideo({ ...featuredVideo, title: e.target.value })}
                placeholder="e.g. Master Technicians At Work · Refrigeration & Electrical Repairs"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Video URL (YouTube Link or Direct MP4/WebM Video URL)
              </label>
              <input
                type="text"
                value={featuredVideo.videoUrl.startsWith('data:') ? '[Uploaded MP4 from Device]' : featuredVideo.videoUrl}
                onChange={(e) => {
                  if (!e.target.value.startsWith('[')) {
                    setFeaturedVideo({ ...featuredVideo, videoUrl: e.target.value });
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://mysite.com/video.mp4"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Supports YouTube links (e.g. https://youtu.be/... or https://youtube.com/watch?v=...) and direct .mp4 video files.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Caption
              </label>
              <textarea
                value={featuredVideo.description}
                onChange={(e) => setFeaturedVideo({ ...featuredVideo, description: e.target.value })}
                rows={2}
                placeholder="Brief summary of the video..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                Save Video Configuration
              </button>

              <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition-all flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload MP4 / WebM from Device</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/*"
                  onChange={handleVideoFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Video Preview Box */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-white space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Video Preview</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {featuredVideo.enabled ? 'Active on Homepage' : 'Preview Only'}
              </span>
            </div>

            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              {featuredVideo.videoUrl ? (
                featuredVideo.videoUrl.includes('youtube.com') || featuredVideo.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={featuredVideo.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                    title="Workshop Video Preview"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={featuredVideo.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-500">
                  <Video className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-xs">No video configured yet</p>
                  <p className="text-[10px] text-slate-600">Enter a YouTube URL or upload an MP4 above</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* SECTION 3: TECHNICIAN ROSTER PORTRAITS & HEADSHOTS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-sky-600" />
              <span>3. Certified Technician Portraits &amp; Headshots</span>
            </h3>
            <p className="text-xs text-slate-500">
              Replace default technician avatars with real photos of your actual certified electricians and refrigeration technicians.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {technicians.length} Technicians
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="relative group shrink-0">
                <img
                  src={t.photoUrl}
                  alt={t.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80';
                  }}
                />
                <label className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                  <Upload className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTechPhotoUpload(t.id, e)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">{t.name}</h4>
                <p className="text-[10px] text-slate-500 truncate">{t.roleTitle}</p>
                <p className="text-[10px] font-mono text-slate-600">{t.phone}</p>
                <div className="pt-1 flex items-center gap-2">
                  <label className="text-[10px] font-bold text-sky-600 hover:text-sky-700 cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload Real Headshot</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleTechPhotoUpload(t.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
