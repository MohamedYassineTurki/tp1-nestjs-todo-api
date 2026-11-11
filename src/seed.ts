import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { AppModule } from './app.module';
import { UserService } from './user/user.service';
import { SkillService } from './skill/skill.service';
import { CvService } from './cv/cv.service';

import {
  randEmail,
  randFirstName,
  randLastName,
  randJobTitle,
  randNumber,
  randPassword,
} from '@ngneat/falso';

const SKILLS = ['JS', 'Python', 'Java', 'SQL', 'Linux', 'Cloud'];

function clean(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
}

async function seedUsers(app: INestApplicationContext) {
  const userService = app.get(UserService);
  const users = [];

  for (let i = 0; i < 5; i++) {
    const firstname = randFirstName();
    const lastname = randLastName();
    const username = `${clean(firstname)}.${clean(lastname)}${i}`;

    const user = await userService.create({
      username,
      email: `${username}@example.com`,
      password: randPassword(),
    });

    users.push({ user, firstname, lastname });
    console.log(`Utilisateur créé : ${user.username}`);
  }

  return users;
}

async function seedSkills(app: INestApplicationContext) {
  const skillService = app.get(SkillService);
  const skills = [];

  for (const designation of SKILLS) {
    const skill = await skillService.create({ designation });
    skills.push(skill);
    console.log(`Compétence créée : ${skill.designation}`);
  }

  return skills;
}

async function seedCvs(
  app: INestApplicationContext,
  users: { user: any; firstname: string; lastname: string }[],
  skills: any[],
) {
  const cvService = app.get(CvService);

  for (const { user, firstname, lastname } of users) {
    const randomSkills = [...skills].sort(() => Math.random() - 0.5).slice(0, 3);

    const cv = await cvService.create({
      name: lastname,
      firstname,
      age: randNumber({ min: 18, max: 67 }),
      cin: randNumber({ min: 10000000, max: 99999999 }).toString(),
      job: randJobTitle(),
      path: 'cv.pdf',
      userId: user.id,
      skillIds: randomSkills.map((skill) => skill.id),
    });
    console.log(`Cv créé : ${cv.firstname} ${cv.name} (user: ${user.username})`);
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const users = await seedUsers(app);
    const skills = await seedSkills(app);
    await seedCvs(app, users, skills);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('Erreur pendant le seed :', error);
  process.exitCode = 1;
});