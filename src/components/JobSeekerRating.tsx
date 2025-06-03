
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Rating = Tables<'ratings'>;

interface JobSeekerRatingProps {
  jobSeekerId: string;
  className?: string;
}

export default function JobSeekerRating({ jobSeekerId, className = "" }: JobSeekerRatingProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, [jobSeekerId]);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('job_seeker_id', jobSeekerId);

      if (error) throw error;
      setRatings(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={`text-sm text-gray-500 ${className}`}>Loading rating...</div>;
  }

  if (ratings.length === 0) {
    return <div className={`text-sm text-gray-500 ${className}`}>No ratings yet</div>;
  }

  const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;
  const roundedRating = Math.round(averageRating * 10) / 10;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(averageRating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {roundedRating} ({ratings.length} review{ratings.length === 1 ? '' : 's'})
      </span>
    </div>
  );
}
