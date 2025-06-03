
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type JobApplication = Tables<'job_applications'> & {
  profiles: Tables<'profiles'>;
};

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplication;
  employerId: string;
  onRatingSubmitted: () => void;
}

export default function RatingDialog({ 
  isOpen, 
  onClose, 
  application, 
  employerId,
  onRatingSubmitted 
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "You must provide a rating between 1 and 5 stars.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Submitting rating:', {
        application_id: application.id,
        employer_id: employerId,
        job_seeker_id: application.applicant_id,
        rating,
        review
      });

      const { error } = await supabase
        .from('ratings')
        .insert({
          application_id: application.id,
          employer_id: employerId,
          job_seeker_id: application.applicant_id,
          rating,
          review: review.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Rating submitted successfully!",
        description: "Thank you for your feedback.",
      });

      // Reset form
      setRating(0);
      setReview('');
      onRatingSubmitted();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: "Failed to submit rating",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Rate Job Seeker</DialogTitle>
          <DialogDescription>
            Rate your experience working with {application.profiles?.full_name || 'this job seeker'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div>
            <Label className="text-base font-medium mb-3 block">Rating *</Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-colors"
                  disabled={isLoading}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <Label htmlFor="review" className="text-base font-medium">
              Review (Optional)
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              Share your experience working with this job seeker
            </p>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Write your review here..."
              rows={4}
              className="resize-none"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || rating === 0}>
            {isLoading ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
