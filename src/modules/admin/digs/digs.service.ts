import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDigDto, SaveResponseItemDto } from './dto/create-dig.dto';
import { UpdateDigDto } from './dto/update-dig.dto';
import { validate } from 'class-validator';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionManager } from '../../../common/helper/subscription.manager';
import { getLevelFromTotalXp } from '../../auth/helper';

function getWeekBoundaries(date: Date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);

  const weekStart = new Date(current.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

@Injectable()
export class DigsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async create(userid: string, createDigDto: CreateDigDto) {
    try {
      const errors = await validate(createDigDto);
      if (errors.length > 0) {
        throw new BadRequestException('Validation failed');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userid, type: 'admin' },
      });

      if (!user) {
        return { success: false, message: 'Only admin can create this' };
      }

      const createdDig = await this.prisma.digs.create({
        data: {
          title: createDigDto.title,
          type: { set: createDigDto.type ?? [] },
          user_id: userid,
          layers: {
            create: createDigDto.layers.map((layer) => ({
              question_name: layer.question_name,
              question_type: layer.question_type,
              point: layer.point,
              question: layer.question,
              options: layer.options ?? [],
              other: layer.other ?? false,
              other_text: layer.other_text,
              text: layer.text,
              user_id: userid,
              correct_answer:
                layer.question_name === 'The_Question' ||
                layer.question_name === 'The_Experience'
                  ? (layer.correct_answer ?? null)
                  : null,
            })),
          },
        },
        include: { layers: true },
      });

      return { success: true, data: createdDig };
    } catch (error) {
      return {
        success: false,
        message: 'Error creating dig',
        error: (error as Error).message,
      };
    }
  }

  // async saveUserResponses(
  //   userId: string,
  //   digId: string,
  //   createdResponses: SaveResponseItemDto[],
  // ) {
  //   const user = await this.prisma.user.findUnique({ where: { id: userId } });
  //   if (!user) return { success: false, message: 'User not found' };

  //   const dig = await this.prisma.digs.findUnique({
  //     where: { id: digId },
  //     include: {
  //       layers: {
  //         where: { deleted_at: null },
  //         select: { id: true },
  //       },
  //     },
  //   });
  //   if (!dig) return { success: false, message: 'Dig not found' };

  //   const totalLayers = dig.layers.length;
  //   if (totalLayers === 0) {
  //     return {
  //       success: false,
  //       message: 'This dig has no active layers configured.',
  //     };
  //   }

  //   const layerIds = createdResponses.map((r) => r.layer_id);

  //   const existingResponses = await this.prisma.digResponse.findMany({
  //     where: { dig_id: digId, user_id: userId },
  //     select: { layer_id: true },
  //   });
  //   const alreadyAnsweredLayerIds = existingResponses.map((r) => r.layer_id);
  //   const completedLayers = alreadyAnsweredLayerIds.length;

  //   if (completedLayers >= totalLayers) {
  //     return {
  //       success: false,
  //       message: 'You have already completed this dig.',
  //     };
  //   }

  //   const duplicateLayers = layerIds.filter((id) =>
  //     alreadyAnsweredLayerIds.includes(id),
  //   );
  //   if (duplicateLayers.length > 0) {
  //     return {
  //       success: false,
  //       message: `You have already answered ${duplicateLayers.length} of these layer(s). Submit only unanswered layers.`,
  //     };
  //   }

  //   const layers = await this.prisma.layers.findMany({
  //     where: {
  //       id: { in: layerIds },
  //       dig_id: digId,
  //       deleted_at: null,
  //     },
  //     select: {
  //       id: true,
  //       question_type: true,
  //       options: true,
  //       other: true,
  //       point: true,
  //     },
  //   });

  //   if (layers.length !== layerIds.length) {
  //     return {
  //       success: false,
  //       message:
  //         'One or more layers do not belong to this dig or have been deleted.',
  //     };
  //   }

  //   const layerMap = new Map(layers.map((l) => [l.id, l]));

  //   for (const response of createdResponses) {
  //     const layer = layerMap.get(response.layer_id);
  //     if (!layer)
  //       return {
  //         success: false,
  //         message: 'Layer does not belong to this dig.',
  //       };

  //     let options: string[] = [];
  //     if (Array.isArray((layer.options as any))) {
  //       options = layer.options as string[];
  //     } else if (typeof (layer.options as any) === 'string') {
  //       try {
  //         options = JSON.parse(layer.options as any);
  //       } catch {
  //         return {
  //           success: false,
  //           message: 'Invalid options configuration on this layer.',
  //         };
  //       }
  //     }

  //     const questionType = String(layer.question_type).toLowerCase();

  //     if (questionType === 'option') {
  //       const normalizedOptions = options.map((o) =>
  //         String(o).trim().toLowerCase(),
  //       );
  //       for (const answer of response.responses) {
  //         const a = String(answer).trim().toLowerCase();
  //         const valid = normalizedOptions.includes(a);
  //         const isOther = layer.other && a.startsWith('other:');
  //         if (!valid && !isOther) {
  //           return {
  //             success: false,
  //             message: `"${answer}" is not a valid option for this question.`,
  //           };
  //         }
  //       }
  //     }

  //     if (questionType === 'text') {
  //       if (
  //         response.responses.length !== 1 ||
  //         typeof response.responses[0] !== 'string'
  //       ) {
  //         return {
  //           success: false,
  //           message: 'Text question requires exactly one string answer.',
  //         };
  //       }
  //     }
  //   }

  //   const savedResponses = await this.prisma.$transaction(
  //     createdResponses.map((r) =>
  //       this.prisma.digResponse.create({
  //         data: {
  //           dig_id: digId,
  //           layer_id: r.layer_id,
  //           user_id: userId,
  //           response: JSON.stringify(r.responses),
  //         },
  //       }),
  //     ),
  //   );

  //   const totalPoints = layers.reduce((sum, l) => sum + (l.point ?? 0), 0);
  //   const newTotalCompleted = completedLayers + savedResponses.length;
  //   const isDigCompleted = newTotalCompleted >= totalLayers;

  //   if (isDigCompleted) {
  //     // ── Subscription guard — fixes TS error ────────────────────────────
  //     const userPlan = await SubscriptionManager(this.prisma, userId);

  //     if (!userPlan || !userPlan.success) {
  //       return {
  //         success: false,
  //         message: userPlan?.message ?? 'Subscription check failed.',
  //       };
  //     }

  //     // TypeScript now knows userPlan is SubscriptionData ✅
  //     const isFreeUser = userPlan.subscriptionName === 'free';

  //     if (isFreeUser) {
  //       const { weekStart } = getWeekBoundaries();
  //       await this.prisma.userWeeklyDig.updateMany({
  //         where: { userId, digId, weekStart },
  //         data: { completed: true },
  //       });
  //     } else {
  //       await this.prisma.userDailyDig.updateMany({
  //         where: { userId, digId },
  //         data: { completed: true },
  //       });
  //     }

  //     if (user.type !== 'admin') {
  //       await this.prisma.digs.update({
  //         where: { id: digId },
  //         data: { answeredCount: { increment: 1 } },
  //       });
  //     }
  //   }

  //   if (user.type !== 'admin' && totalPoints > 0) {
  //     const newTotalXp = (user.acheivedXp ?? 0) + totalPoints;
  //     const newLevel = getLevelFromTotalXp(newTotalXp);
  //     await this.prisma.user.update({
  //       where: { id: userId },
  //       data: { acheivedXp: newTotalXp, currentLevel: newLevel },
  //     });
  //   }

  //   return {
  //     success: true,
  //     data: savedResponses,
  //     totalPoints,
  //     digCompleted: isDigCompleted,
  //     progress: `${newTotalCompleted}/${totalLayers}`,
  //   };
  // }
  async saveUserResponses(
    userId: string,
    digId: string,
    createdResponses: SaveResponseItemDto[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate user
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // 2. Validate dig + layers
      const dig = await tx.digs.findUnique({
        where: { id: digId },
        include: {
          layers: {
            where: { deleted_at: null },
            select: { id: true, point: true },
          },
        },
      });

      if (!dig) {
        return { success: false, message: 'Dig not found' };
      }

      const totalLayers = dig.layers.length;

      if (totalLayers === 0) {
        return {
          success: false,
          message: 'This dig has no active layers configured.',
        };
      }

      const layerIds = createdResponses.map((r) => r.layer_id);

      // 3. Check already answered
      const existingResponses = await tx.digResponse.findMany({
        where: { dig_id: digId, user_id: userId },
        select: { layer_id: true },
      });

      const alreadyAnsweredLayerIds = existingResponses.map((r) => r.layer_id);

      const duplicateLayers = layerIds.filter((id) =>
        alreadyAnsweredLayerIds.includes(id),
      );

      if (duplicateLayers.length > 0) {
        return {
          success: false,
          message: `You already answered ${duplicateLayers.length} layer(s).`,
        };
      }

      // 4. Fetch full layers for validation
      const layers = await tx.layers.findMany({
        where: {
          id: { in: layerIds },
          dig_id: digId,
          deleted_at: null,
        },
        select: {
          id: true,
          question: true,
          question_type: true,
          options: true,
          other: true,
          point: true,
        },
      });

      if (layers.length !== layerIds.length) {
        return {
          success: false,
          message: 'Invalid layer detected.',
        };
      }

      const layerMap = new Map(layers.map((l) => [l.id, l]));

      // 5. Validate ALL answers BEFORE writing anything
      for (const response of createdResponses) {
        const layer = layerMap.get(response.layer_id);
        if (!layer) {
          return { success: false, message: 'Layer mismatch.' };
        }

        const questionType = String(layer.question_type).toLowerCase();

        let options: string[] = [];
        if (Array.isArray(layer.options)) {
          options = layer.options as string[];
        } else if (typeof layer.options === 'string') {
          try {
            options = JSON.parse(layer.options);
          } catch {
            return {
              success: false,
              message: 'Invalid layer options.',
            };
          }
        }

        if (questionType === 'option') {
          const normalized = options.map((o) => o.toLowerCase().trim());

          for (const ans of response.responses) {
            const a = String(ans).toLowerCase().trim();

            const valid =
              normalized.includes(a) || (layer.other && a.startsWith('other:'));

            if (!valid) {
              return {
                success: false,
                message: `"${ans}" is not a valid option.`,
              };
            }
          }
        }

        if (questionType === 'text') {
          if (
            response.responses.length !== 1 ||
            typeof response.responses[0] !== 'string'
          ) {
            return {
              success: false,
              message: 'Text question requires single string answer.',
            };
          }
        }
      }

      // 6. Subscription check BEFORE writing responses
      // const userPlan = await SubscriptionManager(
      //   tx as Parameters<typeof SubscriptionManager>[0],
      //   userId,
      // );

      const enableSubscriptionCheck =
        process.env.ENABLE_SUBSCRIPTION_CHECK === 'true';

      let isFreeUser = false;

      if (enableSubscriptionCheck) {
        const userPlan = await SubscriptionManager(this.prisma, userId);

        if (!userPlan?.success) {
          return {
            success: false,
            message: userPlan?.message ?? 'Subscription check failed',
          };
        }

        isFreeUser = userPlan.subscriptionName === 'free';
      }

      const completedLayers =
        alreadyAnsweredLayerIds.length + createdResponses.length;

      const isDigCompleted = completedLayers >= totalLayers;

      // 7. WRITE responses ONLY AFTER all checks pass
      const savedResponses = await Promise.all(
        createdResponses.map(async (r) => {
          const layer = layerMap.get(r.layer_id)!;

          // Save the response
          const savedResponse = await tx.digResponse.create({
            data: {
              dig_id: digId,
              layer_id: r.layer_id,
              user_id: userId,
              response: JSON.stringify(r.responses),
            },
          });

          // Check if user answered with "Other:"
          const otherAnswer = r.responses.find((ans) =>
            String(ans).toLowerCase().startsWith('other:'),
          );

          if (otherAnswer) {
            await tx.evaction.create({
              data: {
                user_id: userId,
                username: user.username, // or user.name, depending on your User model
                source_title: dig.title,
                question: layer.question,
                answer: otherAnswer.replace(/^other:/i, '').trim(),
              },
            });
          }

          return savedResponse;
        }),
      );

      // 8. XP calculation
      const totalPoints = layers.reduce((sum, l) => sum + (l.point ?? 0), 0);

      if (user.type !== 'admin' && totalPoints > 0) {
        const newTotalXp = (user.acheivedXp ?? 0) + totalPoints;
        const newLevel = getLevelFromTotalXp(newTotalXp);

        await tx.user.update({
          where: { id: userId },
          data: {
            acheivedXp: newTotalXp,
            currentLevel: newLevel,
          },
        });
      }

      // 9. Completion tracking
      if (isDigCompleted) {
        if (enableSubscriptionCheck) {
          if (isFreeUser) {
            const { weekStart } = getWeekBoundaries();

            await tx.userWeeklyDig.updateMany({
              where: { userId, digId, weekStart },
              data: { completed: true },
            });
          } else {
            await tx.userDailyDig.updateMany({
              where: { userId, digId },
              data: { completed: true },
            });
          }
        }

        if (user.type !== 'admin') {
          await tx.digs.update({
            where: { id: digId },
            data: {
              answeredCount: {
                increment: 1,
              },
            },
          });
        }
      }

      // 10. FINAL RESPONSE
      return {
        success: true,
        data: savedResponses,
        totalPoints,
        digCompleted: isDigCompleted,
        progress: `${completedLayers}/${totalLayers}`,
      };
    });
  }

  async getPointsdict(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: 'User not found' };

      const answeredOrNot = await this.prisma.digResponse.findMany({
        where: { user_id: userId },
        select: { dig_id: true, layer_id: true, response: true },
      });

      if (answeredOrNot.length === 0) {
        return {
          success: true,
          message: 'No digs attempted',
          data: 0,
        };
      }

      const getAnsDigsLayerPoints = await this.prisma.layers.findMany({
        where: { dig_id: answeredOrNot[0].dig_id },
        select: { id: true, point: true },
      });

      const totalpointsForCurrentuser = answeredOrNot.reduce((acc, curr) => {
        const layerPoint = getAnsDigsLayerPoints.find(
          (layer) => layer.id === curr.layer_id,
        )?.point;
        return acc + (layerPoint || 0);
      }, 0);

      return {
        success: true,
        message: 'Points retrieved successfully',
        data: totalpointsForCurrentuser,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAlldigs(
    userId: string,
    paginationDto: { page?: number; perPage?: number },
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: 'User not found' };

      const page = paginationDto.page || 1;
      const perPage = paginationDto.perPage || 10;
      const skip = (page - 1) * perPage;

      const answers = await this.prisma.digResponse.findMany({
        where: { user_id: userId },
      });
      const answeredDigIds = new Set(answers.map((a) => a.dig_id));

      const total = await this.prisma.digs.count();

      const digs = await this.prisma.digs.findMany({
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
        include: { layers: true },
      });

      const digsWithStatus = digs.map((dig) => ({
        ...dig,
        is_completed: answeredDigIds.has(dig.id),
      }));

      return {
        success: true,
        message: 'Digs retrieved successfully',
        data: digsWithStatus,
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getDigResponses(digId: string) {
    try {
      const responses = await this.prisma.digResponse.findMany({
        where: { dig_id: digId },
      });
      return { success: true, data: responses };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving dig responses',
        error: (error as Error).message,
      };
    }
  }

  async getSingleDig(digId: string) {
    try {
      const dig = await this.prisma.digs.findUnique({
        where: { id: digId },
        include: { layers: true },
      });
      if (!dig) {
        return { success: false, message: 'Dig not found' };
      }
      return { success: true, data: dig };
    } catch (error) {
      throw error;
    }
  }

  async updateDig(id: string, userId: string, updateDig: UpdateDigDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, type: 'admin' },
      });

      if (!user) {
        return { success: false, message: 'Only admin can update this' };
      }

      const existing = await this.prisma.digs.findFirst({
        where: { id, deleted_at: null },
        include: { layers: { select: { id: true } } },
      });

      if (!existing) {
        return { success: false, message: 'Dig not found' };
      }

      const existingLayerIds = existing.layers.map((l) => l.id);
      if (existingLayerIds.length > 0) {
        await this.prisma.layers.updateMany({
          where: { id: { in: existingLayerIds } },
          data: { deleted_at: new Date() },
        });
      }

      const updated = await this.prisma.digs.update({
        where: { id },
        data: {
          title: updateDig.title,
          type: { set: updateDig.type ?? [] },
          layers: {
            create: updateDig.layers?.map((layer) => ({
              question_name: layer.question_name,
              question_type: layer.question_type,
              point: layer.point,
              question: layer.question,
              options: layer.options ?? [],
              other: layer.other ?? false,
              other_text: layer.other_text,
              text: layer.text,
              user_id: userId,
              correct_answer:
                layer.question_name === 'The_Question' ||
                layer.question_name === 'The_Experience'
                  ? (layer.correct_answer ?? null)
                  : null,
            })),
          },
        },
        include: {
          layers: {
            where: { deleted_at: null },
          },
        },
      });

      return {
        success: true,
        message: 'Dig Update Successful',
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating dig',
        error: (error as Error).message,
      };
    }
  }

  async deleteDig(id: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, type: 'admin' },
    });

    if (!user) {
      throw new NotFoundException('Admin user not found');
    }

    const dig = await this.prisma.digs.findUnique({
      where: { id },
    });

    if (!dig) {
      throw new NotFoundException('Dig not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.digResponse.deleteMany({
        where: { dig_id: id },
      });

      await tx.digs.delete({
        where: { id },
      });
    });

    return {
      success: true,
      message: 'Dig and all related data deleted permanently',
    };
  }

  // evactions

  async getAllEvactions(
    userId: string,
    paginationDto: { page?: number; perPage?: number },
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: 'User not found' };

      const page = paginationDto.page || 1;
      const perPage = paginationDto.perPage || 10;
      const skip = (page - 1) * perPage;

      const total = await this.prisma.evaction.count({
        where: { user_id: userId },
      });

      const evactions = await this.prisma.evaction.findMany({
        where: { user_id: userId },
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
      });

      const favoriteEvactions = await this.prisma.favoriteEvaction.findMany({
        where: {
          user_id: userId,
          evaction_id: {
            in: evactions.map((e) => e.id),
          },
        },
        select: {
          evaction_id: true,
        },
      });

      const favoriteIds = new Set(favoriteEvactions.map((f) => f.evaction_id));

      const data = evactions.map((evaction) => ({
        ...evaction,
        isLiked: favoriteIds.has(evaction.id),
      }));

      return {
        success: true,
        message: 'Evactions retrieved successfully',
        data: data,
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      };
    } catch (error) {
      throw error;
    }
  }
  async toggleFavoriteEvaction(userId: string, evactionId: string) {
    // Check user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Check evaction
    const evaction = await this.prisma.evaction.findUnique({
      where: { id: evactionId },
    });

    if (!evaction) {
      return {
        success: false,
        message: 'Evaction not found',
      };
    }

    // Check existing favorite
    const existing = await this.prisma.favoriteEvaction.findFirst({
      where: {
        user_id: userId,
        evaction_id: evactionId,
      },
    });

    // Unfavorite
    if (existing) {
      await this.prisma.favoriteEvaction.delete({
        where: {
          id: existing.id,
        },
      });

      return {
        success: true,
        isLiked: false,
        message: 'Removed from favorites',
      };
    }

    // Favorite
    await this.prisma.favoriteEvaction.create({
      data: {
        user_id: userId,
        evaction_id: evactionId,
      },
    });

    return {
      success: true,
      isLiked: true,
      message: 'Added to favorites',
    };
  }
  async getFavoriteEvactions(
    userId: string,
    paginationDto: { page?: number; perPage?: number },
  ) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: 'User not found' };

      const page = paginationDto.page || 1;
      const perPage = paginationDto.perPage || 10;
      const skip = (page - 1) * perPage;

      const total = await this.prisma.favoriteEvaction.count({
        where: { user_id: userId },
      });

      const favoriteEvactions = await this.prisma.favoriteEvaction.findMany({
        where: { user_id: userId },
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
        include: {
          evaction: true,
        },
      });

      const data = favoriteEvactions.map((fav) => ({
        ...fav.evaction,
        isLiked: true,
      }));

      return {
        success: true,
        message: 'Favorite evactions retrieved successfully',
        data: data,
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      };
    } catch (error) {
      throw error;
    }
  }
  async getMyEvactions(userId: string, paginationDto: { page?: number; perPage?: number }) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return { success: false, message: 'User not found' };

      const page = paginationDto.page || 1;
      const perPage = paginationDto.perPage || 10;
      const skip = (page - 1) * perPage;

      const total = await this.prisma.evaction.count({
        where: { user_id: userId },
      });

      const evactions = await this.prisma.evaction.findMany({
        where: { user_id: userId },
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
      });

      isLiked: await this.prisma.favoriteEvaction.findMany({
        where: {
          user_id: userId,
          evaction_id: {
            in: evactions.map((e) => e.id),
          },
        },
        select: {
          evaction_id: true,
        },
      });

      const favoriteIds = new Set(
        (await this.prisma.favoriteEvaction.findMany({
          where: {
            user_id: userId,
            evaction_id: {
              in: evactions.map((e) => e.id),
            },
          },
          select: {
            evaction_id: true,
          },
        })).map((f) => f.evaction_id),
      );

      const data = evactions.map((evaction) => ({
        ...evaction,
        isLiked: favoriteIds.has(evaction.id),
      }));

      return {
        success: true,
        message: 'My evactions retrieved successfully',
        data: data,
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
