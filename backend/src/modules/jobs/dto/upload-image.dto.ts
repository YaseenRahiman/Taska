import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UploadJobImageDto {
  @ApiProperty({
    description: 'Image file to upload',
    type: 'string',
    format: 'binary',
  })
  @IsNotEmpty()
  file: Express.Multer.File;
}

export class UploadMultipleImagesDto {
  @ApiProperty({
    description: 'Multiple image files to upload (max 5)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    maxItems: 5,
  })
  @IsNotEmpty()
  files: Express.Multer.File[];
}
