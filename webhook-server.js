const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
app.use(bodyParser.json());

// Endpoint para receber webhook quando uma multa é criada
app.post('/fine-created', (req, res) => {
  console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));
  
  // O formato do webhook pode variar, vamos tentar diferentes possibilidades
  const fine = req.body.record || req.body.new || req.body;
  
  if (!fine) {
    console.error('❌ Dados da multa não encontrados no webhook');
    return res.status(400).send('Dados da multa não encontrados');
  }

  console.log('🚗 Multa recebida:', {
    id: fine.id,
    vehicle_plate: fine.vehicle_plate,
    driver_name: fine.driver_name,
    amount: fine.amount,
    agent_id: fine.agent_id
  });

  // Buscar o proprietário do veículo e o condutor para enviar notificação
  const sendNotifications = async () => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      require('dotenv').config();
      
      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Buscar proprietário do veículo
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('owner_id')
        .eq('plate', fine.vehicle_plate)
        .single();

      // Buscar condutor infrator
      const { data: driver } = await supabase
        .from('drivers')
        .select('owner_id')
        .eq('license_number', fine.driver_license)
        .single();

      const ownerId = vehicle?.owner_id;
      const driverOwnerId = driver?.owner_id;

      const title = '🚨 Nova multa registrada';
      const message = `Multa de Kz ${fine.amount.toLocaleString('pt-AO')} para ${fine.vehicle_plate} em ${fine.date}`;

      // Enviar notificação para o proprietário
      if (ownerId) {
        console.log('📱 Enviando notificação para proprietário:', ownerId);
        exec(`node send-fine-push.js "${ownerId}" "${title}" "${message}"`, (err, stdout, stderr) => {
          if (err) {
            console.error('❌ Erro ao enviar push para proprietário:', err);
          } else {
            console.log('✅ Push enviado para proprietário:', stdout);
          }
        });
      }

      // Enviar notificação para o condutor (se diferente do proprietário)
      if (driverOwnerId && driverOwnerId !== ownerId) {
        console.log('📱 Enviando notificação para condutor:', driverOwnerId);
        exec(`node send-fine-push.js "${driverOwnerId}" "${title}" "${message}"`, (err, stdout, stderr) => {
          if (err) {
            console.error('❌ Erro ao enviar push para condutor:', err);
          } else {
            console.log('✅ Push enviado para condutor:', stdout);
          }
        });
      }

    } catch (error) {
      console.error('❌ Erro ao processar notificações:', error);
    }
  };

  // Executar em background para não bloquear a resposta
  sendNotifications();

  res.status(200).send('Webhook processado com sucesso');
});

// Endpoint de teste
app.get('/test', (req, res) => {
  res.send('Webhook server está funcionando! 🚀');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server rodando na porta ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/fine-created`);
  console.log(`🧪 Teste: http://localhost:${PORT}/test`);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
}); 