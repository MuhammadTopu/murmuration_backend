import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductType {
  BOOK = 'book',
  JOURNAL = 'journal',
  APPAREL = 'apparel',
  CARDS = 'cards',
  LIFE_CALENDAR = 'life_calendar',
  OTHER = 'other',
}

export class CreateAdDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string; // file path or URL

  @IsOptional()
  @IsString()
  link_url?: string;

  @IsOptional()
  @IsEnum(ProductType)
  product_type?: ProductType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;
}