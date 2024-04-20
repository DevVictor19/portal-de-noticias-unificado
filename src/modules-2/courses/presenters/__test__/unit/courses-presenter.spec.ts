import { faker } from '@faker-js/faker';

import { CoursesPresenter } from '../../courses.presenter';

describe('CoursesPresenter unit tests', () => {
  it('Should format the provided output', () => {
    const subject = {
      id: faker.database.mongodbObjectId(),
      name: faker.internet.domainName(),
      created_at: faker.date.anytime(),
      anyInfo1: 'random info1',
      anyInfo2: 'random info2',
    };

    const result = CoursesPresenter.format(subject);

    expect(result).toStrictEqual({
      id: subject.id,
      name: subject.name,
      created_at: subject.created_at,
    });
  });
});