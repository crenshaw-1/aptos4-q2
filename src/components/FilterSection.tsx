import React, { useState } from 'react';
import { Radio, Select, Slider, Space } from 'antd';
import { RarityFilter, SortOption } from '../types';
import { SORT_OPTIONS } from '../constants';

interface FilterSectionProps {
  rarity: RarityFilter;
  sortBy: SortOption;
  priceRange: [number, number];
  onRarityChange: (rarity: RarityFilter) => void;
  onSortChange: (sort: SortOption) => void;
  onPriceRangeChange: (range: [number, number]) => void;
}

// For the Slider type issue, we'll create a specific type for the onChange handler
type RangeValue = [number, number];

export const FilterSection: React.FC<FilterSectionProps> = ({
  rarity,
  sortBy,
  onRarityChange,
  onSortChange,
  onPriceRangeChange,
}) => {
  const [priceRange, setPriceRange] = useState<RangeValue>([0, 1000]); 
  
  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange(()=>value as RangeValue);
    onPriceRangeChange(priceRange)
  };

  
return(
  <>
    <Space direction="vertical" style={{ width: '100%', marginBottom: 20 }}>
      <Select
        style={{ width: 200 }}
        value={sortBy}
        onChange={onSortChange}
        options={SORT_OPTIONS}
      />
       <Slider
            range
            value={priceRange}
            onChange={handlePriceRangeChange}
            max={1000}
            marks={{
            0: '0 APT',
            1000: '1000 APT'
            }}
        />
    </Space>

    <div style={{ marginBottom: "20px" }}>
      <Radio.Group
        value={rarity}
        onChange={(e) => onRarityChange(e.target.value)}
        buttonStyle="solid"
      >
        <Radio.Button value="all">All</Radio.Button>
        <Radio.Button value={1}>Common</Radio.Button>
        <Radio.Button value={2}>Uncommon</Radio.Button>
        <Radio.Button value={3}>Rare</Radio.Button>
        <Radio.Button value={4}>Super Rare</Radio.Button>
      </Radio.Group>
    </div>
  </>
)};
