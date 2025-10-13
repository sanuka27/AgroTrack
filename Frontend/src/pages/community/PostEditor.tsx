import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, X, Send, Eye, Edit, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { communityForumApi } from '../../api/communityForum';
import { PostImage } from '../../types/community';
import { useAuth } from '../../hooks/useAuth';
import { uploadMultipleImages } from '../../utils/firebaseStorage';

export default function PostEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [images, setImages] = useState<PostImage[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [error, setError] = useState('');

  if (!user) {
    navigate('/signin');
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const fileArray = Array.from(files);
    const remainingSlots = 5 - images.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      setError('Maximum 5 images allowed');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const uploadedImages = await uploadMultipleImages(
        filesToUpload,
        user.id,
        (fileIndex, progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileIndex]: progress,
          }));
        }
      );

      setImages((prev) => [...prev, ...uploadedImages]);
      setUploadProgress({});
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!bodyMarkdown.trim()) {
      setError('Post body is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await communityForumApi.createPost({
        title: title.trim(),
        bodyMarkdown: bodyMarkdown.trim(),
        images: images.length > 0 ? images : undefined,
      });

      navigate('/community');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-lg shadow-soft border border-border">
          <div className="p-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">
              Create New Post
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Share your questions, insights, or tips with the community. Use hashtags like #pest-control or #organic to categorize your post.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-card-foreground"
                placeholder="What's your question or topic?"
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/200 characters
              </p>
            </div>

            {/* Body with Preview Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="body" className="block text-sm font-medium text-muted-foreground">
                  Post Body
                </label>
                <button
                  type="button"
                  onClick={() => setIsPreview(!isPreview)}
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover"
                >
                  {isPreview ? (
                    <>
                      <Edit className="w-4 h-4" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Preview
                    </>
                  )}
                </button>
              </div>

              {isPreview ? (
                <div className="min-h-[200px] p-4 border border-border rounded-lg bg-card prose max-w-none text-card-foreground">
                  <ReactMarkdown>
                    {bodyMarkdown || '*Nothing to preview yet...*'}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="body"
                  value={bodyMarkdown}
                  onChange={(e) => setBodyMarkdown(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-card-foreground font-mono text-sm"
                  placeholder="Describe your question or share your knowledge... (Markdown supported)"
                  rows={12}
                  required
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Supports Markdown formatting. Add hashtags like #pest-control to categorize.
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Images (optional)
              </label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.url}
                      alt={`Upload ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      disabled={isUploading}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {/* Upload progress indicators */}
                {Object.entries(uploadProgress).map(([index, progress]) => (
                  <div key={`progress-${index}`} className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mb-1" />
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                ))}
                
                {images.length < 5 && !isUploading && (
                  <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <Image className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload up to 5 images (PNG, JPG, GIF). Images will be compressed automatically.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="px-4 py-2 text-foreground hover:bg-card-foreground/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary-hover disabled:bg-muted text-primary-foreground rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Markdown Guide */}
        <div className="mt-6 bg-card rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Markdown Formatting Guide
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <code className="bg-muted px-1 py-0.5 rounded">**bold**</code>
              <span className="ml-2">Bold text</span>
            </div>
            <div>
              <code className="bg-muted px-1 py-0.5 rounded">*italic*</code>
              <span className="ml-2">Italic text</span>
            </div>
            <div>
              <code className="bg-muted px-1 py-0.5 rounded"># Heading</code>
              <span className="ml-2">Large heading</span>
            </div>
            <div>
              <code className="bg-muted px-1 py-0.5 rounded">- List item</code>
              <span className="ml-2">Bullet list</span>
            </div>
            <div>
              <code className="bg-muted px-1 py-0.5 rounded">`code`</code>
              <span className="ml-2">Inline code</span>
            </div>
            <div>
              <code className="bg-muted px-1 py-0.5 rounded">#hashtag</code>
              <span className="ml-2">Auto-categorize</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
