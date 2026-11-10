import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateCvDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  firstname!: string;

  @IsInt()
  @Min(0)
  age!: number;

  @Matches(/^\d{8}$/, { message: 'cin doit contenir exactement 8 chiffres' })
  cin!: string;

  @IsString()
  @IsNotEmpty()
  job!: string;

  @IsOptional()
  @IsString()
  path?: string;

  // Pas des colonnes de Cv : CvService les convertit en entités User / Skill.
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  skillIds?: number[];
}
