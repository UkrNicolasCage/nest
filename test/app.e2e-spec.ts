import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common/interfaces/nest-application.interface';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';

import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto } from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3000);
    prisma = app.get(PrismaService);

    await prisma.cleanDb();
    pactum.request.setBaseUrl(
      'http://localhost:3000/',
    );
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'vovakill441@gmail.com',
      password: '1111',
    };

    describe('Signup', () => {
      it('should throw if no body provided', () => {
        return pactum
          .spec()
          .post('auth/signup')
          .expectStatus(400);
      });
      it('should throw if email is empty', () => {
        return pactum
          .spec()
          .post('auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if password is empty', () => {
        return pactum
          .spec()
          .post('auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      let accesTken: string;
      it('should throw if no body provided', () => {
        return pactum
          .spec()
          .post('auth/signin')
          .expectStatus(400);
      });
      it('should throw if email is empty', () => {
        return pactum
          .spec()
          .post('auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('should throw if password is empty', () => {
        return pactum
          .spec()
          .post('auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('auth/signin')
          .withBody(dto)
          .expectStatus(202)
          .stores('userAt', 'acces_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should return current user', () => {
        return pactum
          .spec()
          .get('users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });
    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Volodymyr',
          email: 'vlaluk352@gmail.com',
        };
        return pactum
          .spec()
          .patch('users/')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });

  describe('Bookmark', () => {
    describe('Get empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'google',
        description: "it's google link",
        link: 'https://google.com',
      };

      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .inspect();
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(200)
          .inspect();
      });
    });

    describe('Edit bookmark by id', () => {
      it('should edit bookmark by id', () => {
        const dto: CreateBookmarkDto = {
          title: 'google',
          description: "it's google link",
          link: 'https://google.com',
        };

        return pactum
          .spec()
          .patch('bookmarks/{id}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .expectStatus(200);
      });
    });

    describe('Delete bookmark by id', () => {
      it('should edit bookmark by id', () => {
        const dto: CreateBookmarkDto = {
          title: 'google',
          description: "it's google link",
          link: 'https://google.com',
        };

        return pactum
          .spec()
          .delete('bookmarks/{id}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(204);
      });
    });
  });
});
