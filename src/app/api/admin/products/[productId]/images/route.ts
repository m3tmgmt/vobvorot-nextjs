import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Добавление изображения к товару
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const body = await request.json();

    const {
      cloudinary_public_id,
      cloudinary_url,
      optimized_urls,
      is_main = false,
      alt_text,
      display_order
    } = body;

    // Проверяем существование товара
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Если это главное изображение, сбрасываем флаг у других
    if (is_main) {
      await prisma.productImage.updateMany({
        where: { 
          productId: productId,
          isPrimary: true 
        },
        data: { isPrimary: false },
      });
    }

    // Определяем порядок отображения
    let order = display_order;
    if (!order) {
      const lastImage = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { createdAt: 'desc' },
      });
      order = 1;
    }

    // Создаем запись изображения
    const productImage = await prisma.productImage.create({
      data: {
        productId,
        url: cloudinary_url,
        cloudinaryId: cloudinary_public_id,
        isPrimary: is_main,
        alt: alt_text || '',
      },
    });

    // Обновляем основное изображение товара если нужно
    if (is_main) {
      await prisma.product.update({
        where: { id: productId },
        data: { 
          // Note: Product model doesn't have image field in current schema
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...productImage,
        // Note: optimizedUrls field not available in current schema
      },
    });

  } catch (error: any) {
    console.error('Ошибка добавления изображения товара:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при добавлении изображения' 
      },
      { status: 500 }
    );
  }
}

// Получение всех изображений товара
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    // Проверяем существование товара
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Форматируем изображения
    const formattedImages = product.images.map((image: any) => ({
      ...image,
      // Note: optimizedUrls field not available in current schema
    }));

    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          // Note: image and cloudinaryId fields not available in Product model
        },
        images: formattedImages,
        total: formattedImages.length,
      },
    });

  } catch (error: any) {
    console.error('Ошибка получения изображений товара:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при получении изображений' 
      },
      { status: 500 }
    );
  }
}

// Обновление порядка изображений или других свойств
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const body = await request.json();
    const { images } = body; // Массив с id и новыми данными

    if (!Array.isArray(images)) {
      return NextResponse.json(
        { success: false, error: 'Некорректные данные изображений' },
        { status: 400 }
      );
    }

    // Обновляем изображения в транзакции
    const updatedImages = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const imageUpdate of images) {
        const { imageId, ...updateData } = imageUpdate;

        if (!imageId) continue;

        const updated = await tx.productImage.update({
          where: { 
            id: imageId,
            productId: productId, // Убеждаемся что изображение принадлежит товару
          },
          data: updateData,
        });

        results.push(updated);
      }

      return results;
    });

    return NextResponse.json({
      success: true,
      data: updatedImages,
      message: `Обновлено ${updatedImages.length} изображений`,
    });

  } catch (error: any) {
    console.error('Ошибка обновления изображений товара:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при обновлении изображений' 
      },
      { status: 500 }
    );
  }
}

// Удаление изображения товара
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'ID изображения не указан' },
        { status: 400 }
      );
    }

    // Находим изображение
    const image = await prisma.productImage.findUnique({
      where: { 
        id: imageId,
      },
    });

    if (!image || image.productId !== productId) {
      return NextResponse.json(
        { success: false, error: 'Изображение не найдено' },
        { status: 404 }
      );
    }

    // Удаляем из Cloudinary если есть public_id
    if (image.cloudinaryId) {
      try {
        const cloudinaryResponse = await fetch('/api/cloudinary/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_id: image.cloudinaryId }),
        });

        const cloudinaryResult = await cloudinaryResponse.json();
        if (!cloudinaryResult.success) {
          console.warn('Предупреждение: не удалось удалить изображение из Cloudinary:', cloudinaryResult.error);
        }
      } catch (cloudinaryError) {
        console.warn('Предупреждение: ошибка при удалении из Cloudinary:', cloudinaryError);
      }
    }

    // Удаляем из базы данных
    await prisma.productImage.delete({
      where: { id: imageId },
    });

    // Если это было главное изображение, назначаем новое главное
    if (image.isPrimary) {
      const nextMainImage = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: { createdAt: 'asc' },
      });

      if (nextMainImage) {
        await prisma.productImage.update({
          where: { id: nextMainImage.id },
          data: { isPrimary: true },
        });

        // Note: Product model doesn't have image and cloudinaryId fields
        // await prisma.product.update({
        //   where: { id: productId },
        //   data: { 
        //     image: nextMainImage.url,
        //     cloudinaryId: nextMainImage.cloudinaryId,
        //   },
        // });
      } else {
        // Note: Product model doesn't have image and cloudinaryId fields
        // await prisma.product.update({
        //   where: { id: productId },
        //   data: { 
        //     image: null,
        //     cloudinaryId: null,
        //   },
        // });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Изображение успешно удалено',
    });

  } catch (error: any) {
    console.error('Ошибка удаления изображения товара:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Произошла ошибка при удалении изображения' 
      },
      { status: 500 }
    );
  }
}