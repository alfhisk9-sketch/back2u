import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, ShieldAlert } from 'lucide-react';
import type { Item } from '../../types';
import { Badge } from '../ui/Badge';
import { CATEGORY_LABELS } from '../../lib/validation';
import { formatDate } from '../../lib/formatters';

interface ItemCardProps {
  item: Item;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const categoryName = CATEGORY_LABELS[item.category] || item.category;

  return (
    <article className="card-subtle card-hover rounded-2xl overflow-hidden flex flex-col h-full bg-white group">
      {/* Media or Illustration Header */}
      <div className="relative h-48 w-full bg-[#EBF1EE] overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#7C938C] bg-gradient-to-br from-[#EBF1EE] to-[#DDE7E1]">
            <Tag className="w-10 h-10 mb-2 opacity-50 text-[#059669]" />
            <span className="text-xs font-semibold text-[#536B63]">{categoryName}</span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <Badge reportType={item.report_type} size="sm" />
          <Badge status={item.status} size="sm" />
        </div>

        {item.is_sensitive && (
          <div className="absolute top-3 right-3 z-10 bg-amber-900/80 backdrop-blur-xs text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-300" />
            Sensitive ID
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#059669] font-medium mb-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>{categoryName}</span>
          </div>

          <h3 className="text-base font-bold text-[#12241E] line-clamp-1 group-hover:text-[#059669] transition-colors">
            {item.title}
          </h3>

          <p className="mt-1.5 text-xs text-[#536B63] line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="mt-4 pt-3 border-t border-[#E1E8E4] flex flex-col gap-1.5 text-[11px] text-[#536B63]">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            <span className="truncate">{item.location_name}</span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7C938C] shrink-0" />
              <span>{formatDate(item.date_lost_found)}</span>
            </div>

            <Link
              to={`/items/${item.id}`}
              className="font-semibold text-[#059669] hover:underline hover:text-[#047857]"
            >
              View & Claim →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};
