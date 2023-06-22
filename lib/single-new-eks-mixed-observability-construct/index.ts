import { Construct } from 'constructs';
import { EksBlueprint } from '@aws-quickstart/eks-blueprints';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import { cloudWatchDeploymentMode } from '@aws-quickstart/eks-blueprints';
import { TrackerStack } from '../common/usage-tracker';

export default class SingleNewEksMixedobservabilityConstruct {
    constructor(scope: Construct, id: string) {
        // AddOns for the cluster
        const stackId = `${id}-observability-accelerator`;

        const account = process.env.COA_ACCOUNT_ID! || process.env.CDK_DEFAULT_ACCOUNT!;
        const region = process.env.COA_AWS_REGION! || process.env.CDK_DEFAULT_REGION!;

        const cloudWatchAdotAddOn = new blueprints.addons.CloudWatchAdotAddOn({
            deploymentMode: cloudWatchDeploymentMode.DEPLOYMENT,
            namespace: 'default',
            name: 'adot-collector-cloudwatch',
            metricsNameSelectors: ['apiserver_request_.*', 'container_memory_.*', 'container_threads', 'otelcol_process_.*'],
        });
        
        const addOns: Array<blueprints.ClusterAddOn> = [
            new blueprints.addons.NestedStackAddOn({
                builder: TrackerStack.builder(),
                id: "cdk-accelerator-tracker-stack"
            }),
            new blueprints.addons.AwsLoadBalancerControllerAddOn(),
            new blueprints.addons.VpcCniAddOn(),
            new blueprints.addons.CoreDnsAddOn(),
            new blueprints.addons.KubeProxyAddOn(),
            new blueprints.addons.CertManagerAddOn(),
            new blueprints.addons.ExternalsSecretsAddOn(),
            new blueprints.addons.PrometheusNodeExporterAddOn(),
            new blueprints.addons.KubeStateMetricsAddOn(),
            new blueprints.addons.CloudWatchLogsAddon({
                logGroupPrefix: `/aws/eks/${stackId}`,
                logRetentionDays: 30
            }),
            new blueprints.addons.AdotCollectorAddOn(),
            cloudWatchAdotAddOn,
            new blueprints.addons.XrayAdotAddOn(),
        ];

        EksBlueprint.builder()
            .account(account)
            .region(region)
            .addOns(...addOns)
            .build(scope, stackId);
    }
}
