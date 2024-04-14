import { Injectable, NotFoundException } from '@nestjs/common';

import { IBaseUseCase } from '@/common/abstractions/usecases/base-usecase.abstraction';
import { IDatabaseService } from '@/modules/common/database/database-service.interface';

type Input = {
  postTypeId: string;
};

type Output = void;

@Injectable()
export class DeletePostTypesUseCase implements IBaseUseCase<Input, Output> {
  constructor(private databaseService: IDatabaseService) {}

  async execute(input: Input): Promise<Output> {
    const existentPostType = await this.databaseService.postTypes.findById(
      input.postTypeId,
    );

    if (!existentPostType) {
      throw new NotFoundException('Post type not found');
    }

    await this.databaseService.postTypes.delete(input.postTypeId);
  }
}
